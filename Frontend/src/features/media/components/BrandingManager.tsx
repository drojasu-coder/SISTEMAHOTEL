import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ImageOff, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { useBranding, BRANDING_QUERY_KEY } from '../hooks/useBranding';
import { uploadBrandingAsset, type BrandingVariant } from '../api/mediaApi';
import { useTextosMarca } from '../textos';

const VARIANTS: { key: BrandingVariant; dark: boolean }[] = [
  { key: 'logoHorizontalColor', dark: false }, { key: 'logoHorizontalBlanco', dark: true }, { key: 'isotipoColor', dark: false },
];
const TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
const MAX = 5 * 1024 * 1024; // coincide con el límite del servidor

/** Recuadro de vista previa proporcionado: la imagen completa, sin deformar. */
const Preview: React.FC<{ src?: string | null; alt: string; dark: boolean; label: string; empty: string }> = ({ src, alt, dark, label, empty }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <figure className="min-w-0">
    <div className={cn('flex h-28 items-center justify-center rounded-lg border p-3', dark ? 'border-neutro-700 bg-neutro-900' : 'border-neutro-200 bg-white')}>
      {src && !failed ? <img src={src} alt={alt} className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} />
        : <span className={cn('flex items-center gap-1.5 text-xs', dark ? 'text-neutro-300' : 'text-neutro-500')}><ImageOff className="size-4" aria-hidden />{empty}</span>}
    </div>
    <figcaption className="mt-1 text-xs font-medium text-neutro-600">{label}</figcaption>
  </figure>;
};

export const BrandingManager: React.FC = () => {
  const t = useTextosMarca();
  const queryClient = useQueryClient();
  const { data: branding, isLoading, isError, refetch } = useBranding();
  const [files, setFiles] = useState<Partial<Record<BrandingVariant, File>>>({});
  const [errors, setErrors] = useState<Partial<Record<BrandingVariant, string>>>({});
  const [confirm, setConfirm] = useState<BrandingVariant | null>(null);
  const [busy, setBusy] = useState<BrandingVariant | null>(null);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [urls, setUrls] = useState<Partial<Record<BrandingVariant, string>>>({});
  const inputs = useRef<Partial<Record<BrandingVariant, HTMLInputElement | null>>>({});

  useEffect(() => {
    const next: Partial<Record<BrandingVariant, string>> = {};
    for (const [k, f] of Object.entries(files) as [BrandingVariant, File][]) next[k] = URL.createObjectURL(f);
    setUrls(next);
    return () => Object.values(next).forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  const pick = (key: BrandingVariant, file: File | undefined) => {
    setNotice(null);
    if (!file) return;
    if (!TYPES.includes(file.type)) { setErrors(e => ({ ...e, [key]: t.errTipo })); return; }
    if (file.size > MAX) { setErrors(e => ({ ...e, [key]: t.errTam((file.size / 1048576).toFixed(1)) })); return; }
    setErrors(e => ({ ...e, [key]: undefined })); setFiles(f => ({ ...f, [key]: file }));
  };
  const cancel = (key: BrandingVariant) => { setFiles(f => { const n = { ...f }; delete n[key]; return n; }); setErrors(e => ({ ...e, [key]: undefined })); if (inputs.current[key]) inputs.current[key]!.value = ''; };
  const publish = async () => {
    const key = confirm, file = key ? files[key] : undefined;
    if (!key || !file) return;
    setBusy(key); setProgress(0);
    try {
      await uploadBrandingAsset(key, file, setProgress);
      await queryClient.invalidateQueries({ queryKey: BRANDING_QUERY_KEY });
      cancel(key); setNotice(t.ok(t.variantes[key].nombre));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrors(prev => ({ ...prev, [key]: e?.response?.data?.message || t.errSubida }));
    } finally { setBusy(null); setConfirm(null); }
  };

  if (isLoading) return <LoadingNotice label={t.cargando} />;
  return (
    <div className="space-y-4">
      {notice && <Alert tone="success"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><Check className="size-4" aria-hidden />{notice}</span><button type="button" className="text-xs underline" onClick={() => setNotice(null)}>{t.volver}</button></div></Alert>}
      {isError && <div role="alert" className="rounded-xl border border-error-600/20 bg-error-50 p-4 text-sm text-error-700">{t.error} <Button variant="secondary" size="sm" onClick={() => refetch()}>{t.reintentar}</Button></div>}
      <ul className="space-y-4">
        {VARIANTS.map(({ key, dark }) => {
          const v = t.variantes[key], file = files[key], current = branding?.[key];
          return <li key={key} className="rounded-xl border border-neutro-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h2 className="font-sans text-base font-semibold text-neutro-900">{v.nombre}</h2><p className="text-sm text-neutro-600">{v.desc}</p></div>
              <div className="flex gap-2">
                <input ref={el => { inputs.current[key] = el; }} type="file" className="sr-only" tabIndex={-1} accept={TYPES.join(',')} aria-label={`${t.elegir}: ${v.nombre}`} onChange={e => pick(key, e.target.files?.[0])} />
                {file ? <>
                  <Button size="sm" onClick={() => setConfirm(key)} disabled={busy !== null}><Upload className="size-4" aria-hidden />{t.publicar}</Button>
                  <Button size="sm" variant="secondary" onClick={() => cancel(key)} disabled={busy !== null}><X className="size-4" aria-hidden />{t.cancelar}</Button></>
                  : <Button size="sm" variant="secondary" onClick={() => inputs.current[key]?.click()}><Upload className="size-4" aria-hidden />{t.reemplazar}</Button>}
              </div>
            </div>
            <div className={cn('mt-3 grid gap-3', file ? 'sm:grid-cols-2' : 'sm:grid-cols-[minmax(0,22rem)_1fr]')}>
              <Preview src={current} alt={`${v.nombre} · ${t.actual}`} dark={dark} label={`${t.actual} · ${dark ? t.fondoOscuro : t.fondoClaro}`} empty={t.sinImagen} />
              {file ? <div>
                <Preview src={urls[key]} alt={`${v.nombre} · ${t.nueva}`} dark={dark} label={`${t.nueva} · ${dark ? t.fondoOscuro : t.fondoClaro}`} empty={t.sinImagen} />
                <p className="mt-1 truncate text-xs text-neutro-500">{t.archivo(file.name, Math.max(1, Math.round(file.size / 1024)))}</p></div>
                : <div className="text-sm"><p className="text-xs font-medium text-neutro-500">{t.usoTitulo}</p>
                  {v.usos.length ? <ul className="mt-1 list-disc space-y-0.5 pl-4 text-neutro-700">{v.usos.map(u => <li key={u}>{u}</li>)}</ul> : <p className="mt-1 text-neutro-500">{t.sinUso}</p>}
                  <p className="mt-2 text-xs text-neutro-400">{t.formatos}</p></div>}
            </div>
            {errors[key] && <p role="alert" className="mt-2 text-xs font-medium text-error-700">{errors[key]}</p>}
            {busy === key && <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutro-200"><div className="h-full bg-bronce-600 transition-all" style={{ width: `${progress}%` }} /></div>}
          </li>;
        })}
      </ul>
      <p className="text-xs text-neutro-500">{t.noEditable}</p>
      <Modal open={confirm !== null} onClose={() => setConfirm(null)} busy={busy !== null} busyLabel={t.publicando} title={t.confirmarTitulo} description={confirm ? t.confirmarDesc(t.variantes[confirm].nombre) : ''} closeLabel={t.volver}>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy !== null}>{t.volver}</Button><Button onClick={() => void publish()} isLoading={busy !== null}>{busy ? t.publicando : t.confirmar}</Button></div>
      </Modal>
    </div>
  );
};
