type ClassValue = string | false | null | undefined;

/** Une clases condicionales (equivalente mínimo a clsx; sin dependencias). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
