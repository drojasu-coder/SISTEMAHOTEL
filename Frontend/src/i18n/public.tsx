import { textosMisReservas } from '@/features/mis-reservas/textos';
import { textosCarrito } from '@/features/carrito/textos';
import { textosCheckout, textosPagos } from '@/features/pagos/textos';
import React, { useEffect, useMemo, useRef } from 'react';
import { ApiError } from '@/api/client/http';
import { useLocale } from './LocaleContext';
import { es } from './es';
import { textosActividades } from '@/features/actividades/textos';
import { textosBienestar } from '@/features/bienestar/textos';
import { textosEventos, etiquetasTipoEvento } from '@/features/eventos/textos';
import { textosCrearReserva } from '@/features/crear-reserva/textos';
import { publicEn } from './public.en';
import { extraEs, extraEn, type ExtraKey } from './publicExtra';
import { formatDisplayMoney } from '@/lib/money';
import { formatCalendarDate } from '@/lib/dates';
export const publicEs = { misReservas: textosMisReservas, carrito: textosCarrito, checkout: textosCheckout, pagos: textosPagos, estados: es.estados, auth: es.auth, comunes: es.comunes, restaurante: es.restaurante, amenidades: es.amenidades, actividades: textosActividades, bienestar: textosBienestar, eventos: textosEventos, tiposEvento: etiquetasTipoEvento, crearReserva: textosCrearReserva };
type Widen<T> = T extends (...args: infer A) => unknown ? (...args: A) => string : T extends string ? string : { [K in keyof T]: Widen<T[K]> };
export type PublicSection = keyof typeof publicEs;
/** Fusiona por clave, con fallback español. No examina ni sustituye frases del DOM. */
export function mergePublic<T>(base: T, translated: unknown): Widen<T> {
  if (typeof base === 'string') return (typeof translated === 'string' && translated.trim() ? translated : base) as Widen<T>;
  if (typeof base === 'function') return (typeof translated === 'function' ? translated : base) as Widen<T>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(base as object)) result[key] = mergePublic(value, translated && typeof translated === 'object' ? (translated as Record<string, unknown>)[key] : undefined);
  return result as Widen<T>;
}
export function usePublicTexts<K extends PublicSection>(section: K): Widen<(typeof publicEs)[K]> {
  const { locale } = useLocale();
  return useMemo(() => mergePublic(publicEs[section], locale === 'en' ? publicEn[section] : undefined), [locale, section]);
}
export function usePublicInterface() {
  const { locale, currency } = useLocale();
  const p = (key: ExtraKey, params: Record<string, string | number> = {}) => {
    let text: string = (locale === 'en' && extraEn[key]?.trim()) || extraEs[key];
    for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  };
  const states: Record<string, string> = locale === 'en' ? publicEn.estados : es.estados;
  return { locale, p, stateLabel: (value: string) => states[value] ?? value, money: (value: unknown) => formatDisplayMoney(value, currency) ?? p('amountUnavailable'), date: (value: unknown) => formatCalendarDate(value, locale) ?? p('dateUnavailable') };
}
export type LocalizedError = { section: PublicSection | 'extra'; key: string } | { server: string } | { api: unknown };
export const TranslatedError: React.FC<{ error: LocalizedError }> = ({ error }) => {
  const { locale, p } = usePublicInterface();
  if ('api' in error) {
    const api = error.api;
    if (api instanceof ApiError) {
      if (api.status === 0) return <>{p('networkError')}</>;
      if (api.status >= 500) return <>{p('serverError')}</>;
      if (api.status === 429) return <>{p('tooManyRequests')}</>;
      if (api.code === 'VALIDATION_ERROR') return <>{p('invalidField')}</>;
      if (api.code === 'USER_INACTIVE') return <>{p('authInactive')}</>;
      if (api.code === 'INVALID_CREDENTIALS') return <>{p('invalidLogin')}</>;
      if (api.code === 'EMAIL_ALREADY_REGISTERED') return <>{p('emailRegistered')}</>;
      return <span lang="es">{api.message}</span>;
    }
    if (api instanceof Error && api.name === 'AuthFlowError') return locale === 'en' ? <>{p('unknownRole')}</> : <span lang="es">{api.message}</span>;
    return <>{p('requestError')}</>;
  }
  if ('server' in error) return <span lang="es">{error.server}</span>;
  if (error.section === 'extra') return <>{p(error.key as ExtraKey)}</>;
  const dictionary = mergePublic(publicEs[error.section], locale === 'en' ? publicEn[error.section] : undefined);
  const value = error.key.split('.').reduce<unknown>((node, key) => node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined, dictionary);
  return <>{typeof value === 'string' ? value : p('requestError')}</>;
};
export function useRevalidateErrors(locale: 'es' | 'en', trigger: () => Promise<boolean>, hasErrors: boolean) {
  const previous = useRef(locale);
  useEffect(() => {
    if (previous.current !== locale && hasErrors) void trigger();
    previous.current = locale;
  }, [locale, trigger, hasErrors]);
}
