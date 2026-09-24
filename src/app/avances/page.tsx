import type { Metadata } from "next";
import { SUCURSAL } from "@/lib/negocio";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Avances del sistema — Turbo Presta El Dorado",
  robots: { index: false, follow: false },
};

interface Item {
  titulo: string;
  estado: "listo" | "camino";
  resumen: string;
  detalle: string;
  imagen?: string;
}

const ITEMS: Item[] = [
  {
    titulo: "Cotizador de vehículos, en línea",
    estado: "listo",
    resumen: "Ya cualquiera puede cotizar su carro desde su celular, sin llamar ni venir a la sucursal.",
    detalle:
      "Nueva página pública (sin necesidad de cuenta ni contraseña): el cliente escribe qué carro tiene y cuánto necesita, y queda registrado automáticamente en el sistema — listo para que el equipo le dé seguimiento por WhatsApp. Siempre deja claro que es un estimado, sujeto a revisar el vehículo en persona.",
    imagen: "/avances/cotizador.png",
  },
  {
    titulo: "Préstamo y avalúo, uno junto al otro",
    estado: "listo",
    resumen: "Al armar un contrato, ahora se ve de un vistazo cuánto vale la prenda y cuánto se le va a cobrar al cliente — igual que en el sistema anterior.",
    detalle:
      "Se agregó una tarjeta con Préstamo, Avalúo, Refrendo y Desempeño calculados en el momento, con la fórmula real (no un aproximado) — para comparar el valor del bien contra lo que pide el cliente antes de aprobar nada. El IVA queda fijo al 8%, no se puede cambiar por error.",
    imagen: "/avances/empeno-avaluo.png",
  },
  {
    titulo: "Catálogo de tasas, como lo conocen",
    estado: "listo",
    resumen: "Los porcentajes que aparecen al armar un contrato ya son los mismos números que usaban antes.",
    detalle:
      "Producto \"Tradicional\" al 21.6% y \"Compra\" al 0.72% mensual/diario, tal como en el sistema anterior — por dentro el sistema sigue calculando interés y almacenaje por separado para que la cuenta salga exacta, solo cambió cómo se ve en pantalla.",
    imagen: "/avances/catalogo.png",
  },
  {
    titulo: "Recargos por atraso, ya no se escriben a mano",
    estado: "listo",
    resumen: "Cuando un contrato está vencido, el sistema ya sugiere solo el cargo por atraso — antes había que calcularlo y teclearlo.",
    detalle:
      "Se tomó la tasa real del contrato de la sucursal (6% del préstamo por desempeño extemporáneo) y se precarga automáticamente en el recibo cuando aplica. Sigue siendo editable, por si Gerencia decide perdonarlo en algún caso.",
  },
  {
    titulo: "Tablero: lo urgente, separado de lo demás",
    estado: "listo",
    resumen: "Los contratos vencidos ya no se mezclan con los que solo están por vencer — y se agregó cuánto hay por recuperar en total.",
    detalle:
      "Antes, si había muchos vencidos, tapaban a los que apenas iban a vencer y no se alcanzaban a ver. Ahora son dos listas separadas, y arriba se ve de un vistazo el capital prestado, lo que hay por recuperar y el saldo en caja.",
    imagen: "/avances/tablero.png",
  },
  {
    titulo: "Transferencias en el corte de caja",
    estado: "listo",
    resumen: "Ya se puede anotar un movimiento bancario sin que se mezcle con el efectivo real que hay que contar.",
    detalle:
      "Antes no había dónde registrar una transferencia — ahora tiene su propio espacio en el corte de caja, y a propósito NO se suma al \"efectivo esperado\" (porque ese dinero nunca estuvo físicamente en el cajón).",
    imagen: "/avances/corte.png",
  },
  {
    titulo: "Editar un usuario ya dado de alta",
    estado: "listo",
    resumen: "Antes solo se podía prender o apagar el acceso de alguien — ahora también se le corrige el nombre, correo, puesto o contraseña.",
    detalle: "Sin tener que borrar a la persona y volver a capturarla desde cero.",
  },
  {
    titulo: "Buscador que ya no falla",
    estado: "listo",
    resumen: "Buscar \"Perez\" ya encuentra a \"Pérez\", y da igual si se escribe el apellido antes que el nombre.",
    detalle:
      "Se corrigió en las 5 pantallas donde se busca algo: Mostrador, Buscar, Clientes, Empeños y Prendas. También el teléfono se encuentra aunque se escriba sin espacios ni guiones.",
  },
  {
    titulo: "Vehículo con GPS, desde el alta normal",
    estado: "listo",
    resumen: "Ya se puede marcar que el cliente se queda con el carro (con GPS instalado) desde el formulario de siempre, no solo desde el asistente guiado.",
    detalle: "Con su costo mensual de renta y la ubicación anotada.",
  },
  {
    titulo: "Cancelar un contrato mal capturado",
    estado: "listo",
    resumen: "Si se metió un empeño por error, ya hay un botón para cancelarlo — antes no existía esa opción.",
    detalle:
      "Solo funciona si el contrato todavía no tiene ningún pago (para no borrar historial real); libera la prenda y ajusta la caja solo.",
  },
  {
    titulo: "Protección contra spam en los formularios públicos",
    estado: "camino",
    resumen: "Que nadie pueda tronar el cotizador ni la agenda de citas a propósito, ni con un bot simple.",
    detalle:
      "Ya está construido y probado — límite de intentos por visitante y una trampa invisible para bots. Falta solo subirlo.",
  },
];

export default function AvancesPage() {
  const listos = ITEMS.filter((i) => i.estado === "listo").length;

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gold-gradient px-6 py-8 text-primary-fg shadow-soft md:px-10 md:py-10">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-fg/80">
            {SUCURSAL.nombre} — reporte de avances
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Qué se hizo en el sistema
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-fg/90">
            Resumen en español sencillo de los cambios más recientes — con capturas de
            pantalla reales del sistema, no un mockup.
          </p>
        </div>

        {/* Resumen */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Badge tono="success">{listos} cambios ya en producción</Badge>
          {ITEMS.some((i) => i.estado === "camino") && (
            <Badge tono="warning">{ITEMS.filter((i) => i.estado === "camino").length} en camino</Badge>
          )}
        </div>

        {/* Lista de cambios */}
        <div className="space-y-6">
          {ITEMS.map((item) => (
            <Card key={item.titulo} className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">{item.titulo}</h2>
                  <p className="mt-1 text-sm text-muted">{item.resumen}</p>
                </div>
                <Badge tono={item.estado === "listo" ? "success" : "warning"}>
                  {item.estado === "listo" ? "✅ Listo" : "🔜 En camino"}
                </Badge>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-foreground">{item.detalle}</p>
              </div>
              {item.imagen && (
                <div className="border-t border-border bg-surface-2 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imagen}
                    alt={item.titulo}
                    className="w-full rounded-lg border border-border shadow-soft"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted">
          {SUCURSAL.nombre} · {SUCURSAL.direccion}
        </p>
      </div>
    </div>
  );
}
