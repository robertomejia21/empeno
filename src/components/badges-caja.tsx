import { Badge } from "./ui";
import type { TipoMovimiento } from "@/lib/types";

const map: Record<TipoMovimiento, { label: string; tono: Parameters<typeof Badge>[0]["tono"] }> = {
  prestamo: { label: "Préstamo", tono: "danger" },
  desempeno: { label: "Desempeño", tono: "success" },
  refrendo: { label: "Refrendo", tono: "info" },
  abono: { label: "Abono", tono: "info" },
  venta: { label: "Venta", tono: "success" },
  gasto: { label: "Gasto", tono: "danger" },
  apertura: { label: "Apertura", tono: "muted" },
  retiro: { label: "Retiro", tono: "danger" },
  deposito: { label: "Depósito", tono: "success" },
  compra: { label: "Compra", tono: "danger" },
  cancelacion: { label: "Cancelación", tono: "muted" },
  transferencia: { label: "Transferencia", tono: "info" },
};

export function TipoMovBadge({ tipo }: { tipo: TipoMovimiento }) {
  const x = map[tipo];
  return <Badge tono={x.tono}>{x.label}</Badge>;
}
