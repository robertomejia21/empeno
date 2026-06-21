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
      { href: "/", label: "Tablero", icon: "📊" },
      { href: "/empenos", label: "Empeños", icon: "🤝" },
      { href: "/prendas", label: "Prendas", icon: "💍" },
      { href: "/clientes", label: "Clientes", icon: "👤" },
      { href: "/recordatorios", label: "Recordatorios", icon: "🔔" },
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
      { href: "/reportes", label: "Reportes", icon: "📈" },
    ],
  },
  {
    titulo: "Cumplimiento",
    items: [
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
