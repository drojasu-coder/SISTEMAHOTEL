export function publicPhone(value: string): { display: string; href: string } {
  const clean = value.replace(/[^+0-9]/g, '');
  const local = /^\d{8}$/.test(clean) ? clean : /^\+?502\d{8}$/.test(clean) ? clean.replace(/^\+?502/, '') : null;
  if (local) return { display: `+502 ${local.slice(0, 4)}-${local.slice(4)}`, href: `tel:+502${local}` };
  return { display: value.trim(), href: `tel:${clean}` };
}
