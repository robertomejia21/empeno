import {
  BadgeCheck,
  Bell,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Gavel,
  HandCoins,
  KeyRound,
  LayoutDashboard,
  MessagesSquare,
  PackagePlus,
  ReceiptText,
  Satellite,
  Scale,
  ScanLine,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  titulo: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    titulo: "Operación",
    items: [
      { href: "/oficina", label: "Oficina virtual", icon: Building2 },
      { href: "/mostrador", label: "Mostrador", icon: Store },
      { href: "/", label: "Tablero", icon: LayoutDashboard },
      { href: "/empenos", label: "Empeños", icon: HandCoins },
      { href: "/cotizaciones", label: "Cotizaciones", icon: ReceiptText },
      { href: "/prendas/escanear", label: "Escanear prenda", icon: ScanLine },
      // Oculto temporalmente (la ruta /prendas sigue activa):
      // { href: "/prendas", label: "Comprar", icon: ShoppingBag },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/recordatorios", label: "Recordatorios", icon: Bell },
      { href: "/conversaciones", label: "Conversaciones", icon: MessagesSquare },
      { href: "/buscar", label: "Buscar", icon: Search },
    ],
  },
  {
    titulo: "Punto de venta",
    items: [
      { href: "/remates", label: "Remates", icon: Gavel },
      { href: "/ventas", label: "Ventas", icon: ShoppingCart },
      { href: "/compras", label: "Compra directa", icon: PackagePlus },
      { href: "/apartados", label: "Apartados", icon: Tag },
    ],
  },
  {
    titulo: "Finanzas",
    items: [
      { href: "/caja", label: "Caja", icon: Wallet },
      { href: "/corte", label: "Corte de caja", icon: Calculator },
      { href: "/vencimientos", label: "Vencimientos", icon: CalendarClock },
      { href: "/cobranza", label: "Cobranza", icon: CreditCard },
      { href: "/reportes", label: "Reportes", icon: TrendingUp },
    ],
  },
  {
    titulo: "Vehículos",
    items: [
      { href: "/gps", label: "GPS y resguardo", icon: Satellite },
      { href: "/gps/citas", label: "Citas de GPS", icon: CalendarDays },
      { href: "/avaluos", label: "Avalúos (mecánico)", icon: Wrench },
      { href: "/checklist-vehiculos", label: "Checklist diario", icon: ClipboardCheck },
    ],
  },
  {
    titulo: "Cumplimiento",
    items: [
      { href: "/autorizaciones", label: "Autorizaciones", icon: BadgeCheck },
      { href: "/cumplimiento", label: "Cumplimiento PLD", icon: ShieldCheck },
      { href: "/avaluo", label: "Avalúo metales", icon: Scale },
    ],
  },
  {
    titulo: "Sistema",
    items: [
      { href: "/encuestas", label: "Encuestas", icon: ClipboardList },
      { href: "/bitacora", label: "Bitácora", icon: ScrollText },
      { href: "/usuarios", label: "Usuarios", icon: KeyRound },
      { href: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

// Lista plana (para la barra móvil: principales)
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
