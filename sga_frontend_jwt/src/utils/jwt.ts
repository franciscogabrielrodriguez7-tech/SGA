/**
 * Decodifica el payload de un JWT (sin verificar la firma — eso es
 * responsabilidad del backend). Solo se usa en el cliente para saber
 * si el token ya venció antes de hacer una petición real.
 *
 * Si el token está malformado o no tiene `exp`, retorna null para que
 * el caller lo trate como token inválido/expirado.
 */
export function jwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, parteBase64] = token.split(".");
    if (!parteBase64) return null;
    // atob no conoce Base64Url → reemplazamos - por + y _ por /
    const json = atob(parteBase64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Devuelve true si el JWT ya venció (compara `exp` con el reloj del
 * cliente). Se le suma 10 segundos de margen para evitar falsos positivos
 * por diferencia de reloj entre servidor y cliente.
 */
export function jwtExpirado(token: string): boolean {
  const payload = jwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  const ahoraEnSegundos = Math.floor(Date.now() / 1000);
  return payload.exp < ahoraEnSegundos + 10;
}
