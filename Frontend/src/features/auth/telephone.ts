/** Normalización del teléfono, nunca de la contraseña. No afirma validar números asignados. */
export function normalizePhone(value: string, callingCode = ''): string {
  const compact = value.trim().replace(/[\s()\-]/g, '');
  if (!compact) return '';
  return compact.startsWith('+') || !callingCode ? compact : `${callingCode}${compact}`;
}
