export const SITE_KEY = 'hunahpu.public-site.v1';
export const LANGUAGE_KEY = 'hunahpu.language.v1';
export type PublicSite = number | 'all';
export function readPreference(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
export function writePreference(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* La preferencia sigue vigente en memoria. */ }
}
export function parseSite(value: string | null): PublicSite | null {
  if (value === 'all') return 'all';
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
export function initialLanguage(saved: string | null, browser: string): 'es' | 'en' {
  return saved === 'es' || saved === 'en' ? saved : /^en(?:-|$)/i.test(browser) ? 'en' : 'es';
}
