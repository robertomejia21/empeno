// Utilidades de imagen del lado del cliente.

/** Lee un archivo como data URL (base64). */
export function leerArchivo(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(f);
  });
}

/**
 * Reduce una foto a `maxLado` px y la recomprime a JPEG.
 * Una foto de celular pesa 4–8 MB, y en base64 crece un 33%: sin reducirla
 * revienta el límite de los Server Actions. Si el navegador no sabe decodificar
 * el formato (HEIC en Chrome), se devuelve el original: Gemini sí lo entiende.
 */
export async function normalizarImagen(f: File, maxLado = 1600, calidad = 0.85): Promise<string> {
  const original = await leerArchivo(f);
  try {
    const bitmap = await createImageBitmap(f);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", calidad);
  } catch {
    return original;
  }
}

/** Tamaño aproximado en bytes de un data URL base64. */
export function pesoDataUrl(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((b64.length * 3) / 4);
}
