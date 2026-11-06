// Ajustes del sistema editables desde /configuracion (Dirección General).
// Este módulo es puro (sin acceso a BD) para poder usarse también en el
// navegador — p. ej. el asistente de empeño calcula el préstamo sugerido.
// La lectura/escritura vive en src/lib/db/repo.ts y src/lib/actions.ts.

export interface AjustesDireccion {
  /** Correo de Dirección: recibe reportes y avisos. */
  correo: string;
  /** WhatsApp de Dirección (con lada, ej. 5216861571095): recibe reportes y autorizaciones. */
  whatsapp: string;
}

export interface AjustesPrestamo {
  /** Avalúo (MXN) a partir del cual cambia el % de préstamo. */
  umbral: number;
  /** % del avalúo que se presta cuando el avalúo es hasta el umbral. */
  pctHastaUmbral: number;
  /** % del avalúo que se presta cuando el avalúo es mayor al umbral. */
  pctArribaUmbral: number;
}

/**
 * Cómo se cobra el interés del periodo en curso cuando el cliente desempeña
 * (liquida) antes de que termine el periodo:
 *  - "completo":     se cobra el mes completo (comportamiento anterior).
 *  - "proporcional": solo los días transcurridos del periodo (carátula PROFECO:
 *                    tasa anual / 360 × días efectivamente transcurridos).
 *  - "gracia":       si liquida dentro de los primeros N días del periodo nuevo
 *                    no se cobra ese periodo; después, el mes completo.
 */
export type ModoDesempeno = "completo" | "proporcional" | "gracia";

export interface AjustesDesempeno {
  modo: ModoDesempeno;
  /** Días de gracia del modo "gracia". */
  diasGracia: number;
}

export interface DiaFestivo {
  fecha: string; // YYYY-MM-DD
  nombre: string;
}

export interface Ajustes {
  direccion: AjustesDireccion;
  prestamo: AjustesPrestamo;
  desempeno: AjustesDesempeno;
  /** Días que la sucursal cierra: no cuentan como día de retraso (además de los domingos). */
  festivos: DiaFestivo[];
}

export const AJUSTES_DEFAULT: Ajustes = {
  direccion: {
    correo: "josecruzgs@outlook.com",
    whatsapp: "5216861571095",
  },
  prestamo: {
    umbral: 10000,
    pctHastaUmbral: 50,
    pctArribaUmbral: 40,
  },
  desempeno: { modo: "proporcional", diasGracia: 5 },
  festivos: [],
};

/** Reglas que necesita el cálculo de liquidaciones (se leen de los ajustes). */
export interface ReglasCalculo {
  festivos: readonly string[];
  desempeno: AjustesDesempeno;
}

/** Claves con las que se guarda cada sección en la tabla `ajustes`. */
export type ClaveAjuste = keyof Ajustes;

/** % del avalúo que se presta según el monto del avalúo. */
export function porcentajePrestamo(avaluo: number, cfg: AjustesPrestamo): number {
  return avaluo > cfg.umbral ? cfg.pctArribaUmbral : cfg.pctHastaUmbral;
}

/** Fechas (YYYY-MM-DD) de los festivos, para pasarlas al cálculo de retraso. */
export function fechasFestivas(festivos: DiaFestivo[]): string[] {
  return festivos.map((f) => f.fecha);
}
