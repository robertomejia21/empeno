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
  nuevo?: boolean;
}

const ITEMS: Item[] = [
  {
    titulo: "Pin de ubicación corregido en vehículos",
    estado: "listo",
    resumen: "El mapa de ubicación de los vehículos (en GPS y en resguardo) ya marca el lugar correcto — antes a veces se iba a un punto equivocado.",
    detalle:
      "Ahora, al dar de alta un vehículo, se usa el mismo mapa interactivo (buscar dirección o marcar el punto en el mapa) en los dos lugares donde se captura, en vez de escribir la ubicación a mano.",
    nuevo: true,
  },
  {
    titulo: "Checklist diario de vehículos en resguardo",
    estado: "listo",
    resumen: "Nueva pantalla para revisar físicamente cada día los vehículos que están guardados en la sucursal.",
    detalle:
      "Lista automáticamente los vehículos en resguardo y permite marcar presente, exterior, interior, llantas, fugas, cerrado/seguro, llaves, batería y carrocería de cada uno, con espacio para notas e incidencias del día. Queda guardado el historial.",
    nuevo: true,
  },
  {
    titulo: "Checklist del mecánico corregido",
    estado: "listo",
    resumen: "La lista de revisión que llena el mecánico al avaluar un vehículo ya coincide exactamente con el formato oficial.",
    detalle: "Tenía un punto de más (\"Cauchos\") y le faltaba uno (\"Gasolina\") comparado con el Excel real que usa la sucursal — ya quedó igual.",
    nuevo: true,
  },
  {
    titulo: "La fecha de pago ya no se recorre",
    estado: "listo",
    resumen: "El día de pago de un contrato queda fijo desde que se abre — antes, pagar antes o después iba corriendo la fecha poco a poco.",
    detalle:
      "Además, si el día de pago cae en domingo o día festivo, el sistema avisa que el cliente puede pagar el día hábil más cercano sin que eso cambie la fecha registrada.",
    nuevo: true,
  },
  {
    titulo: "Historial de fotos del vehículo",
    estado: "listo",
    resumen: "En la ficha de cada vehículo ya se ve, lado a lado, la primera foto (cuando ingresó) contra la más reciente, para comparar su estado.",
    detalle: "Un botón abre todas las fotos ordenadas por fecha, dejando siempre fija la primera como punto de referencia.",
    nuevo: true,
  },
  {
    titulo: "Guía de valor de vehículo por año",
    estado: "listo",
    resumen: "Al capturar el año del vehículo, se muestra como referencia el valor comercial estimado y el préstamo sugerido para ese rango de años.",
    detalle: "Es solo una guía (con datos que ustedes proporcionaron) — nunca reemplaza el avalúo físico real.",
    nuevo: true,
  },
  {
    titulo: "Más seguridad en firmas y documentos financieros",
    estado: "listo",
    resumen: "Se reforzaron varios puntos de seguridad detectados en una revisión completa del sistema.",
    detalle:
      "La firma digital del cliente en el contrato ya no se puede borrar desde el enlace público; los recibos y estados de cuenta ya verifican que quien los descarga tenga el rol correcto; y la encuesta pública quedó protegida contra spam, igual que los demás formularios abiertos.",
    nuevo: true,
  },
  {
    titulo: "Tope antilavado en todos los movimientos grandes",
    estado: "listo",
    resumen: "La regla que divide un movimiento de más de $999,999 (exigida por la ley contra lavado de dinero) ya aplica en refrendo, desempeño, ventas, compras y abonos — antes solo cubría el préstamo inicial.",
    detalle: "También se agregó un tope: ya no se puede abonar a capital más de lo que realmente se debe.",
    nuevo: true,
  },
  {
    titulo: "Verificación REPUVE obligatoria para empeñar un vehículo",
    estado: "listo",
    resumen: "Ya no se puede crear el contrato de un vehículo sin haber registrado la verificación REPUVE (sin reporte de robo) — antes solo lo pedía el asistente guiado, no el alta rápida.",
    detalle: "Se agregó esa verificación también a la pantalla de alta rápida de vehículos, para que no quede ningún camino sin el candado.",
    nuevo: true,
  },
  {
    titulo: "Ajustes visuales: tablero, corte de caja y menú",
    estado: "listo",
    resumen: "Se revisó el diseño de todo el sistema y se corrigieron varios detalles que se veían mal en celular o se sentían inconsistentes.",
    detalle:
      "El tablero y reportes ya no se cortan en pantallas angostas; la tarjeta de apertura de caja ya no deja espacio vacío; el menú lateral ya no estorba en tablets; y \"Enviar a remate\" cambió de rojo a ámbar para no confundirse con las acciones de cancelar/eliminar (que sí son irreversibles).",
    nuevo: true,
  },
  {
    titulo: "Eliminar un contrato de prueba, de forma permanente",
    estado: "listo",
    resumen: "Dirección General ya puede borrar por completo un contrato de prueba (y su prenda) de la base de datos.",
    detalle:
      "Exclusivo de Dirección General, desde el detalle del contrato. Borra el contrato, su prenda y sus pagos — no se puede deshacer, y el sistema no lo permite si esa prenda ya se le vendió a un cliente real (para no perder un dato de venta de verdad).",
  },
  {
    titulo: "Conteo de vehículos por modalidad",
    estado: "listo",
    resumen: "El resumen de cartera ahora dice cuántos vehículos hay con GPS, cuántos en resguardo, y cuántas motos en resguardo.",
    detalle: "Se agregó a la tarjeta \"Resumen de cartera\" de Reportes, junto a los demás totales.",
  },
  {
    titulo: "Inventario por categoría",
    estado: "listo",
    resumen: "Reportes ya muestra cuántas piezas y cuánto valor hay por categoría (joyería, electrónica, vehículos…).",
    detalle: "Nueva tarjeta en Reportes, separada de \"Valor de inventario\".",
  },
  {
    titulo: "Reportes: desglose por vehículos y artículos",
    estado: "listo",
    resumen: "Nueva tabla en Reportes que separa empeños, refrendos y desempeños entre Vehículos y Artículos.",
    detalle:
      "Usa el mismo cálculo que ya traía el informe semanal del tablero, pero aplicado al periodo que elijas en Reportes — con su propia descarga en Excel.",
  },
  {
    titulo: "Reportes con rango de fechas",
    estado: "listo",
    resumen: "Ya se puede elegir \"del — al\" en Reportes, en vez de ver siempre el mes actual.",
    detalle: "El flujo de ingresos y egresos, y su descarga en Excel, ahora respetan el rango de fechas que elijas.",
  },
  {
    titulo: "Catálogo de tasas, solo para Dirección General",
    estado: "listo",
    resumen: "La pantalla donde se editan las tasas de interés ahora es exclusiva de Dirección General.",
    detalle: "Gerencia ya puede ver el resto de Configuración, pero ya no puede modificar el catálogo de tasas.",
  },
  {
    titulo: "Descuento en ventas, con autorización de Gerencia",
    estado: "listo",
    resumen: "Si al vender un artículo el descuento pasa del 40% del avalúo, el sistema pide un usuario de Gerencia o Dirección General.",
    detalle: "Aplica en el punto de venta de artículos en remate; por debajo del 40% cualquier usuario puede vender normalmente.",
  },
  {
    titulo: "Buscar en Remates",
    estado: "listo",
    resumen: "Ya se puede buscar por folio, cliente o descripción dentro de los empeños vencidos listos para remate.",
    detalle: "Mismo buscador que ya usan Mostrador, Clientes, Empeños y Prendas.",
  },
  {
    titulo: "Se quitó el informe mensual del tablero",
    estado: "listo",
    resumen: "El tablero principal ya no muestra la tarjeta de \"Informe mensual\" — quedó solo el semanal.",
    detalle: "La descarga en Excel del mes completo sigue disponible para quien la necesite.",
  },
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
    estado: "listo",
    resumen: "Que nadie pueda tronar el cotizador ni la agenda de citas a propósito, ni con un bot simple.",
    detalle: "Límite de intentos por visitante y una trampa invisible para bots, en ambos formularios públicos.",
  },
];

export default function AvancesPage() {
  const listos = ITEMS.filter((i) => i.estado === "listo").length;
  const nuevos = ITEMS.filter((i) => i.nuevo).length;

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
          {nuevos > 0 && <Badge tono="info">🆕 {nuevos} nuevos desde la última actualización</Badge>}
          {ITEMS.some((i) => i.estado === "camino") && (
            <Badge tono="warning">{ITEMS.filter((i) => i.estado === "camino").length} en camino</Badge>
          )}
        </div>

        {/* Lista de cambios */}
        {nuevos > 0 && (
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
            Actualización — 19 de octubre
          </h2>
        )}
        <div className="space-y-6">
          {ITEMS.map((item, i) => (
            <div key={item.titulo}>
              {i > 0 && ITEMS[i - 1].nuevo && !item.nuevo && (
                <h2 className="mb-6 mt-2 text-sm font-bold uppercase tracking-wide text-muted">
                  Actualizaciones anteriores
                </h2>
              )}
              <Card className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">{item.titulo}</h3>
                    {item.nuevo && <Badge tono="info">🆕 Nuevo</Badge>}
                  </div>
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
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted">
          {SUCURSAL.nombre} · {SUCURSAL.direccion}
        </p>
      </div>
    </div>
  );
}
