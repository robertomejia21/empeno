"""Genera un script SQL para importar los contratos vigentes del sistema anterior.

Uso (desde la raíz del repo):
    python -I scripts/importar_contratos.py "C:/ruta/BASE DE DATOS.xlsx" "C:/ruta/importar_contratos.sql" [AAAA-MM-DD]

El .sql resultante se ejecuta una sola vez en Supabase → SQL Editor. Todo va en
una transacción: si algún folio ya existe, no se importa nada.
NO subas el .sql al repositorio: contiene nombres de clientes.

Reglas de conversión:
- Folio del empeño = número de contrato anterior (contrato 125 → EM-0125). La
  secuencia de folios se adelanta para que los contratos nuevos sigan la numeración.
- Fechas: si el vencimiento original ya pasó, el contrato entra en su periodo
  actual (mismo día del mes, como hace el refrendo), asumiendo que está al
  corriente. creado_en = fecha y hora originales del empeño (para reportes y PLD).
- Tasa del sistema anterior (incluía un cargo extra) → catálogo actual:
  11.60 → 10.80 · 9.28 → 8.64 · 6.96 → 6.48 · TRADICIONAL 23.20 → 10.80 interés + 10.80 almacenaje.
  IVA 8% aparte, como el resto del sistema.
- Clientes: se crean con nombre y apellidos; CURP, teléfono e identificación
  quedan pendientes (aparecen en Cumplimiento como expediente incompleto).
"""

from __future__ import annotations

import calendar
import sys
import uuid
from datetime import date, datetime

import openpyxl

MESES = {"ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
         "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12}

# Tasa del sistema anterior → (interés %, almacenaje %)
TASAS = {
    11.6: (10.8, 0.0),
    9.28: (8.64, 0.0),
    6.96: (6.48, 0.0),
    23.2: (10.8, 10.8),
}

CATEGORIA_POR_FAMILIA = {
    "AUTOMOVIL": ("Vehículos", "Automóvil"),
    "CAMIONETAS": ("Vehículos", "Camioneta"),
    "MOTOCICLETAS": ("Vehículos", "Motocicleta"),
    "ELECTRONICOS": ("Electrónica", None),
    "CELULAR": ("Electrónica", None),
    "HERRAMIENTA": ("Herramientas", None),
    "HERRAMIENTA INDUSTRIAL": ("Herramientas", None),
    "ELECTRODOMESTICOS": ("Electrodomésticos", None),
    "BICICLETAS": ("Otro", None),
}

DIAS_GRACIA = 5
IVA = 8


def q(v) -> str:
    """Literal SQL."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(round(v, 2)) if isinstance(v, float) else str(v)
    return "'" + str(v).replace("'", "''") + "'"


def fecha(txt: str) -> date:
    d, m, a = str(txt).strip().split("/")
    return date(int(a), MESES[m.lower()[:3]], int(d))


def hora(txt) -> str:
    t = str(txt or "12:00:00 pm").strip().lower()
    return datetime.strptime(t, "%I:%M:%S %p").strftime("%H:%M:%S")


def numero(txt) -> float:
    return float(str(txt).replace(",", "").strip() or 0)


def sumar_meses(base: date, n: int) -> date:
    m = base.month - 1 + n
    a = base.year + m // 12
    m = m % 12 + 1
    return date(a, m, min(base.day, calendar.monthrange(a, m)[1]))


def periodo_actual(inicio: date, hoy: date) -> tuple[date, date, int]:
    """(inicio del periodo vigente, vencimiento, refrendos supuestos)."""
    k = 0
    while sumar_meses(inicio, k + 1) <= hoy:
        k += 1
    return sumar_meses(inicio, k), sumar_meses(inicio, k + 1), k


def titulo(s: str) -> str:
    return " ".join(p.capitalize() for p in s.split())


def partir_nombre(completo: str) -> tuple[str, str, str]:
    t = completo.split()
    if len(t) >= 4:
        return titulo(" ".join(t[:-2])), titulo(t[-2]), titulo(t[-1])
    if len(t) == 3:
        return titulo(t[0]), titulo(t[1]), titulo(t[2])
    if len(t) == 2:
        return titulo(t[0]), titulo(t[1]), ""
    return titulo(completo), "", ""


def leer(ruta: str) -> list[dict]:
    wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    filas = ws.iter_rows(values_only=True)
    enc = [str(c).strip() if c is not None else "" for c in next(filas)]
    datos, vacias = [], 0
    for r in filas:
        if not r or not any(r):
            vacias += 1
            if vacias > 50:  # la hoja trae ~1M de filas con formato vacías
                break
            continue
        vacias = 0
        datos.append({enc[i]: ("" if c is None else str(c).strip()) for i, c in enumerate(r) if i < len(enc)})
    return datos


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    origen, destino = sys.argv[1], sys.argv[2]
    hoy = date.fromisoformat(sys.argv[3]) if len(sys.argv) > 3 else date.today()
    filas = [f for f in leer(origen) if f.get("Contrato")]

    clientes: dict[str, str] = {}
    sql_cli, sql_pre, sql_emp, avisos, folios = [], [], [], [], []
    max_contrato = 0

    for f in filas:
        contrato = int(float(f["Contrato"]))
        max_contrato = max(max_contrato, contrato)
        folio = f"EM-{contrato:04d}"
        folios.append(folio)

        nombre_completo = " ".join(f["Cliente"].split()).upper()
        if nombre_completo not in clientes:
            cid = str(uuid.uuid4())
            clientes[nombre_completo] = cid
            n, ap, am = partir_nombre(nombre_completo)
            sql_cli.append(
                f"({q(cid)}, {q(n)}, {q(ap)}, {q(am)}, 'INE', '', "
                f"{q('Importado del sistema anterior. Pendiente: CURP, teléfono e identificación.')})"
            )
        cid = clientes[nombre_completo]

        tasa_txt = f["Tasa"]
        modalidad_txt, _, valor = tasa_txt.partition("-")
        valor_f = round(float(valor), 2)
        if valor_f not in TASAS:
            raise SystemExit(f"Contrato {contrato}: tasa desconocida {tasa_txt}")
        tasa, almacenaje = TASAS[valor_f]

        familia = f["Familia"].upper()
        if familia not in CATEGORIA_POR_FAMILIA:
            raise SystemExit(f"Contrato {contrato}: familia desconocida {familia}")
        categoria, tipo_veh = CATEGORIA_POR_FAMILIA[familia]
        es_vehiculo = categoria == "Vehículos"
        modalidad = ("gps" if modalidad_txt.upper() == "GPS" else "resguardo") if es_vehiculo else None

        inicio_orig = fecha(f["F. Empeño"])
        inicio, venc, refrendos = periodo_actual(inicio_orig, hoy)
        creado = f"{inicio_orig.isoformat()} {hora(f.get('Hora'))}"
        prestamo, avaluo = numero(f["Préstamo"]), numero(f["Avaluo"])
        descripcion = f["Descripcion"] or " ".join(x for x in [titulo(familia), f["Marca"], f["Modelo"]] if x)

        pid = str(uuid.uuid4())
        nota_prenda = f"Importado del sistema anterior (contrato {contrato}, familia {familia})."
        if f.get("N. Prendas/Peso"):
            nota_prenda += f" Prendas/peso: {f['N. Prendas/Peso']}."
        sql_pre.append(
            "(" + ", ".join([
                q(pid), q(categoria), q(descripcion), q(f["Marca"] or None), q(f["Modelo"] or None),
                q(avaluo), q(prestamo), "'empenada'", "'{}'", "false", q(tipo_veh), q(modalidad),
                q("Matriz" if es_vehiculo else None), q(nota_prenda),
                f"(timestamp {q(creado)} at time zone 'America/Tijuana')",
            ]) + ")"
        )

        nota_emp = (
            f"Importado del sistema anterior. Contrato original {contrato} del {inicio_orig.strftime('%d/%m/%Y')}, "
            f"tasa {tasa_txt}, capturó {f.get('Usuario') or '—'}."
        )
        if refrendos:
            nota_emp += f" Se asumió al corriente: periodo actual desde {inicio.strftime('%d/%m/%Y')}."
        sql_emp.append(
            "(" + ", ".join([
                q(folio), q(cid), q(pid), q(prestamo), q(tasa), "'mensual'", "1",
                q(inicio.isoformat()), q(venc.isoformat()), str(DIAS_GRACIA),
                q("refrendado" if refrendos else "activo"), q(nota_emp),
                q(almacenaje), str(IVA), "'efectivo'", "0",
                f"(timestamp {q(creado)} at time zone 'America/Tijuana')",
            ]) + ")"
        )

    # Mismo bien en varios contratos vigentes (posible duplicado en el sistema anterior).
    por_bien: dict[tuple, list[int]] = {}
    for f in filas:
        clave = (" ".join(f["Cliente"].split()).upper(), f["Familia"], f["Descripcion"] or f["Marca"])
        por_bien.setdefault(clave, []).append(int(float(f["Contrato"])))
    for (cli, _fam, desc), cs in por_bien.items():
        if len(cs) > 1 and CATEGORIA_POR_FAMILIA[_fam][0] == "Vehículos":
            avisos.append(f"Mismo vehículo en {len(cs)} contratos vigentes: {cli} · {desc} → {cs}")

    lista_folios = ", ".join(q(x) for x in folios)
    out = [
        "-- Importación de contratos vigentes del sistema anterior.",
        f"-- Generado el {date.today().isoformat()} con fecha de corte {hoy.isoformat()} desde {origen}",
        f"-- {len(filas)} contratos · {len(clientes)} clientes. Ejecutar UNA vez en Supabase → SQL Editor.",
        "begin;",
        "",
        "do $$ begin",
        f"  if exists (select 1 from public.empenos where folio in ({lista_folios})) then",
        "    raise exception 'Alguno de estos folios ya existe: la importación ya se hizo o hay que revisar.';",
        "  end if;",
        "end $$;",
        "",
        "insert into public.clientes (id, nombre, apellido_paterno, apellido_materno, tipo_identificacion, numero_identificacion, notas) values",
        ",\n".join(sql_cli) + ";",
        "",
        "insert into public.prendas (id, categoria, descripcion, marca, modelo, valor_avaluo, monto_prestamo_sugerido, estado, fotos, verificado, tipo_vehiculo, modalidad, resguardo_tipo, notas, creado_en) values",
        ",\n".join(sql_pre) + ";",
        "",
        "insert into public.empenos (folio, cliente_id, prenda_id, monto_prestado, tasa_interes, periodo, plazo_periodos, fecha_inicio, fecha_vencimiento, dias_gracia, estado, notas, almacenaje_pct, iva_pct, metodo_pago, abono_capital, creado_en) values",
        ",\n".join(sql_emp) + ";",
        "",
        "-- Los contratos nuevos continúan después del último contrato importado.",
        f"select setval('public.empeno_folio_seq', greatest({max_contrato}, (select last_value from public.empeno_folio_seq)));",
        "",
        "commit;",
    ]
    with open(destino, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")

    print(f"OK: {len(filas)} contratos, {len(clientes)} clientes → {destino}")
    print(f"Folios EM-{min(int(float(f['Contrato'])) for f in filas):04d} a EM-{max_contrato:04d}")
    for a in avisos:
        print("AVISO:", a)


if __name__ == "__main__":
    main()
