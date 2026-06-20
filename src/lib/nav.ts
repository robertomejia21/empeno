export interface NavItem {
  href: string;
  label: string;
  icon: string; // emoji simple para no depender de librería de íconos
  descripcion: string;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Tablero", icon: "📊", descripcion: "Resumen general" },
  { href: "/empenos", label: "Empeños", icon: "🤝", descripcion: "Préstamos y contratos" },
  { href: "/prendas", label: "Prendas", icon: "💍", descripcion: "Inventario y avalúos" },
  { href: "/clientes", label: "Clientes", icon: "👤", descripcion: "Registro y KYC" },
  { href: "/caja", label: "Caja", icon: "💵", descripcion: "Movimientos y corte" },
];
