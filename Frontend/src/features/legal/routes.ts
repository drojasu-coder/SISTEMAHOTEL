import type { LegalSlug } from './types';

/** Rutas públicas de los documentos legales (accesibles sin iniciar sesión). */
export const LEGAL_ROUTES: Record<LegalSlug, string> = {
  terminos: '/terminos',
  privacidad: '/privacidad',
  reservas: '/legal/reservas-cancelaciones-y-reembolsos',
  almacenamiento: '/legal/cookies-y-almacenamiento',
  preguntas: '/preguntas-frecuentes',
};

export const LEGAL_ORDER: LegalSlug[] = ['terminos', 'privacidad', 'reservas', 'almacenamiento', 'preguntas'];

/** Fecha de la última revisión del contenido (AAAA-MM-DD). */
export const LEGAL_UPDATED_AT = '2026-10-29';
