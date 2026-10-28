export function publicPhone(value: string): { display: string; href: string } {
  const clean = value.replace(/[^+0-9]/g, '');
  const local = /^\d{8}$/.test(clean) ? clean : /^\+?502\d{8}$/.test(clean) ? clean.replace(/^\+?502/, '') : null;
  if (local) return { display: `+502 ${local.slice(0, 4)}-${local.slice(4)}`, href: `tel:+502${local}` };
  return { display: value.trim(), href: `tel:${clean}` };
}

/** Formato de contactos configurados, incluidos los de referencia aprobados del proyecto. */
export function publicContactPhone(value: unknown): ReturnType<typeof publicPhone> | null {
  if (typeof value !== 'string' || /\p{L}/u.test(value)) return null;
  const clean = value.replace(/[^+0-9]/g, '');
  if (!/^\+?\d{8,15}$/.test(clean)) return null;
  return publicPhone(value.trim());
}

export function publicContactEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  if (!/^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/.test(email)) return null;
  return email;
}

export function publicContactAddress(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}
