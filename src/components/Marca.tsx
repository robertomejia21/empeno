// Identidad de Turbo Presta El Dorado.
// El icono reproduce el cubo del logo: auto, moto y electrodomésticos.

export function MarcaIcono({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Turbo Presta">
      <title>Turbo Presta</title>
      {/* Cara superior */}
      <path d="M24 4 42 13.5 24 23 6 13.5Z" fill="#ffffff" stroke="#1c2b3a" strokeWidth="2" strokeLinejoin="round" />
      {/* Cara izquierda */}
      <path d="M6 13.5 24 23v21L6 34.5Z" fill="#f2f6f9" stroke="#1c2b3a" strokeWidth="2" strokeLinejoin="round" />
      {/* Cara derecha */}
      <path d="M42 13.5 24 23v21l18-9.5Z" fill="#e6eef4" stroke="#1c2b3a" strokeWidth="2" strokeLinejoin="round" />
      {/* Auto (cara superior) */}
      <path d="M15 13.2c1.6-1.6 3.4-2.6 5.6-2.9 2.3-.3 4.6.1 6.8 1l3.4 1.5-2.6 1.4c-2 1-4.2 1.4-6.4 1.1-2.4-.3-4.6-1.2-6.8-2.1Z" fill="#e02b20" />
      <circle cx="19.4" cy="14.6" r="1.15" fill="#1c2b3a" />
      <circle cx="27.6" cy="13.4" r="1.15" fill="#1c2b3a" />
      {/* Moto (cara izquierda) */}
      <circle cx="11.4" cy="27.4" r="2.5" fill="none" stroke="#1b6fb8" strokeWidth="1.6" />
      <circle cx="19.2" cy="31.4" r="2.5" fill="none" stroke="#1b6fb8" strokeWidth="1.6" />
      <path d="M11.4 27.4 15 26.6l4.2 4.8" stroke="#1b6fb8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Refri + llave (cara derecha) */}
      <rect x="28" y="25.5" width="5.4" height="9.2" rx="1" fill="none" stroke="#1c2b3a" strokeWidth="1.5" />
      <path d="M28 29.4h5.4" stroke="#1c2b3a" strokeWidth="1.3" />
      <path d="M35.6 34.2c-1.1-1.1-1.1-2.6-.3-3.6l-2.1-2.1 1.5-1.5 2.1 2.1c1-.8 2.5-.8 3.6.3" stroke="#1c2b3a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

