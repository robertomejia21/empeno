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

/** Horario de un grupo de días. Horas en formato 24 h "HH:MM". */
export interface TurnoDia {
  abierto: boolean;
  abre: string;
  cierra: string;
}

/** Horario de servicio al público: sale en el contrato, tickets y sistema. */
export interface AjustesHorario {
  lunesViernes: TurnoDia;
  sabado: TurnoDia;
  domingo: TurnoDia;
}

export interface DiaFestivo {
  fecha: string; // YYYY-MM-DD
  nombre: string;
}

export interface Ajustes {
  direccion: AjustesDireccion;
  prestamo: AjustesPrestamo;
  desempeno: AjustesDesempeno;
  horario: AjustesHorario;
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
  horario: {
    lunesViernes: { abierto: true, abre: "07:00", cierra: "16:00" },
    sabado: { abierto: true, abre: "08:00", cierra: "13:00" },
    domingo: { abierto: false, abre: "09:00", cierra: "13:00" },
  },
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

/** "07:00" → "7:00" */
function hora(h: string): string {
  return h.replace(/^0(\d)/, "$1");
}

const GRUPOS_HORARIO: { clave: keyof AjustesHorario; largo: string; corto: string }[] = [
  { clave: "lunesViernes", largo: "lunes a viernes", corto: "L-V" },
  { clave: "sabado", largo: "sábados", corto: "SÁB" },
  { clave: "domingo", largo: "domingos", corto: "DOM" },
];

/** "Lunes a viernes de 7:00 a 16:00 hrs, sábados de 8:00 a 13:00 hrs y domingos cerrado" */
export function textoHorario(h: AjustesHorario): string {
  const partes = GRUPOS_HORARIO.map(({ clave, largo }) => {
    const t = h[clave];
    return t.abierto ? `${largo} de ${hora(t.abre)} a ${hora(t.cierra)} hrs` : `${largo} cerrado`;
  });
  const txt = `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/** Versión corta para tickets: "L-V 7:00-16:00 · SÁB 8:00-13:00 · DOM CERRADO" */
export function textoHorarioCorto(h: AjustesHorario): string {
  return GRUPOS_HORARIO.map(({ clave, corto }) => {
    const t = h[clave];
    return t.abierto ? `${corto} ${hora(t.abre)}-${hora(t.cierra)}` : `${corto} CERRADO`;
  }).join(" · ");
}
