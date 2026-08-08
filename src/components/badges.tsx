import { Badge } from "./ui";
import type { EstadoEmpeno, EstadoPrenda } from "@/lib/types";

const empenoMap: Record<EstadoEmpeno, { label: string; tono: Parameters<typeof Badge>[0]["tono"] }> = {
  borrador: { label: "Borrador (pend. autorización)", tono: "warning" },
  cancelado: { label: "Cancelado", tono: "danger" },
  activo: { label: "Activo", tono: "success" },
  refrendado: { label: "Refrendado", tono: "info" },
  vencido: { label: "Vencido", tono: "danger" },
  desempenado: { label: "Desempeñado", tono: "muted" },
  en_remate: { label: "En remate", tono: "warning" },
  rematado: { label: "Rematado", tono: "muted" },
};

export function estadoEmpenoBadge(estado: EstadoEmpeno) {
  const x = empenoMap[estado];
  return <Badge tono={x.tono}>{x.label}</Badge>;
}

const prendaMap: Record<EstadoPrenda, { label: string; tono: Parameters<typeof Badge>[0]["tono"] }> = {
  en_avaluo: { label: "En avalúo", tono: "warning" },
  empenada: { label: "Empeñada", tono: "info" },
  desempenada: { label: "Desempeñada", tono: "muted" },
  en_venta: { label: "En venta", tono: "primary" },
  apartada: { label: "Apartada", tono: "warning" },
  vendida: { label: "Vendida", tono: "success" },
};

export function estadoPrendaBadge(estado: EstadoPrenda) {
  const x = prendaMap[estado];
  return <Badge tono={x.tono}>{x.label}</Badge>;
}
