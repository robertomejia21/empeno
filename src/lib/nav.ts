export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  titulo: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    titulo: "Operación",
    items: [
      { href: "/oficina", label: "Oficina virtual", icon: "🏢" },
      { href: "/mostrador", label: "Mostrador", icon: "🏪" },
      { href: "/", label: "Tablero", icon: "📊" },
      { href: "/empenos", label: "Empeños", icon: "🤝" },
      { href: "/cotizaciones", label: "Cotizaciones", icon: "🧾" },
      { href: "/prendas/escanear", label: "Escanear prenda", icon: "📷" },
      // Oculto temporalmente (la ruta /prendas sigue activa):
      // { href: "/prendas", label: "Comprar", icon: "🛍️" },
      { href: "/clientes", label: "Clientes", icon: "👤" },
      { href: "/recordatorios", label: "Recordatorios", icon: "🔔" },
      { href: "/conversaciones", label: "Conversaciones", icon: "💬" },
      { href: "/buscar", label: "Buscar", icon: "🔍" },
    ],
  },
  {
    titulo: "Punto de venta",
    items: [
      { href: "/remates", label: "Remates", icon: "🔨" },
      { href: "/ventas", label: "Ventas", icon: "🛒" },
      { href: "/compras", label: "Compra directa", icon: "📥" },
      { href: "/apartados", label: "Apartados", icon: "🏷️" },
    ],
  },
  {
    titulo: "Finanzas",
    items: [
      { href: "/caja", label: "Caja", icon: "💵" },
      { href: "/corte", label: "Corte de caja", icon: "🧮" },
      { href: "/vencimientos", label: "Vencimientos", icon: "📆" },
      { href: "/cobranza", label: "Cobranza", icon: "💳" },
      { href: "/reportes", label: "Reportes", icon: "📈" },
    ],
  },
  {
    titulo: "Vehículos",
    items: [
      { href: "/gps", label: "GPS y resguardo", icon: "📡" },
      { href: "/gps/citas", label: "Citas de GPS", icon: "📅" },
    ],
  },
  {
    titulo: "Cumplimiento",
    items: [
      { href: "/autorizaciones", label: "Autorizaciones", icon: "✅" },
      { href: "/cumplimiento", label: "Cumplimiento PLD", icon: "🛡️" },
      { href: "/avaluo", label: "Avalúo metales", icon: "⚖️" },
    ],
  },
  {
    titulo: "Sistema",
    items: [
      { href: "/bitacora", label: "Bitácora", icon: "📜" },
      { href: "/usuarios", label: "Usuarios", icon: "🔑" },
      { href: "/configuracion", label: "Configuración", icon: "⚙️" },
    ],
  },
];

// Lista plana (para la barra móvil: principales)
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
