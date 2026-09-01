// Normalización compartida para las búsquedas de la app (mostrador, buscador
// global, clientes, empeños, prendas). Antes cada pantalla hacía su propio
// `.toLowerCase().includes(t)`, lo que falla si:
//   - el nombre tiene acento y se buscó sin él (o al revés): "Perez" vs "Pérez"
//   - se busca "apellido nombre" en vez del orden en que está guardado
//   - un teléfono/folio tiene otro formato (espacios, guiones)

/** Quita acentos/diacríticos y pasa a minúsculas. */
export function normalizarBusqueda(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas diacríticas (acentos, diéresis)
    .toLowerCase()
    .trim();
}

/**
 * ¿Los `campos` (unidos) contienen TODAS las palabras de `busqueda`, sin
 * importar acentos ni el orden? Campos vacíos/null se ignoran.
 */
export function coincideTexto(campos: (string | number | null | undefined)[], busqueda: string): boolean {
  const palabras = normalizarBusqueda(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return false;
  const texto = normalizarBusqueda(
    campos
      .filter((v) => v !== null && v !== undefined && v !== "")
      .map(String)
      .join(" ")
  );
  return palabras.every((p) => texto.includes(p));
}

/** Solo dígitos — para comparar teléfonos/folios sin importar el formato. */
export function soloDigitos(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

/** ¿El teléfono guardado contiene los dígitos buscados? Ignora formato (espacios, guiones, lada). */
export function coincideTelefono(telefono: string | null | undefined, busqueda: string): boolean {
  const digitos = soloDigitos(busqueda);
  return digitos.length > 0 && soloDigitos(telefono).includes(digitos);
}
