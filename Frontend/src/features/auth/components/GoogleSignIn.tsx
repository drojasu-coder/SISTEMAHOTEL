import { useEffect, useRef, useState } from 'react';
import { env } from '@/app/config/env';
import { ApiError } from '@/api/client/http';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { usePublicInterface } from '@/i18n/public';
import { useAuth } from '../AuthContext';
import { authApi } from '../api/authApi';
import { loadGoogleIdentity } from '../googleIdentity';
import { googleTexts } from '../googleTexts';
import type { GoogleChallenge } from '../types';

export function GoogleSignIn({ disabled = false, onBusyChange }: {
  disabled?: boolean; onBusyChange: (busy: boolean) => void;
}) {
  const { locale } = usePublicInterface();
  const text = googleTexts[locale === 'en' ? 'en' : 'es'];
  const { googleLogin } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  const pending = useRef<{ credential: string; challenge: GoogleChallenge } | null>(null);
  const submitting = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const [linking, setLinking] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const finishRef = useRef<(credential: string, challenge: GoogleChallenge, password?: string) => Promise<void>>(async () => {});
  finishRef.current = async (credential, challenge, currentPassword) => {
    if (submitting.current || disabledRef.current) return;
    submitting.current = true;
    setBusy(true); onBusyChange(true); setError(null);
    try {
      await googleLogin({ credential, challengeId: challenge.challengeId, ...(currentPassword ? { password: currentPassword } : {}) }, challenge.nonce);
      pending.current = null;
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : undefined;
      if (code === 'GOOGLE_LINK_REQUIRED') {
        pending.current = { credential, challenge };
        setLinking(true);
      } else {
        setError(code ?? 'fallback');
        if (code !== 'INVALID_CREDENTIALS') { pending.current = null; setLinking(false); setReady(false); }
      }
    } finally {
      setPassword(''); submitting.current = false; setBusy(false); onBusyChange(false);
    }
  };

  useEffect(() => {
    if (!env.googleLoginEnabled) return;
    let live = true;
    const controller = new AbortController();
    let observer: ResizeObserver | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    setReady(false); setError(null); setLinking(false); setPassword(''); pending.current = null;
    const prepare = async () => {
      // No carga el proveedor si el backend no tiene la función habilitada/configurada.
      const challenge = await authApi.googleChallenge(controller.signal);
      if (!live) return;
      if (challenge.clientId !== env.googleClientId) throw new Error('GOOGLE_CONFIG_MISMATCH');
      const gis = await loadGoogleIdentity(locale);
      if (!live || !container.current) return;
      gis.initialize({ client_id: env.googleClientId, nonce: challenge.nonce, auto_select: false, ux_mode: 'popup',
        callback: ({ credential }) => { if (live && credential) void finishRef.current(credential, challenge); },
      });
      const element = container.current;
      let lastWidth = 0;
      const render = () => {
        const width = Math.max(200, Math.min(400, Math.floor(element.getBoundingClientRect().width)));
        if (width === lastWidth) return;
        lastWidth = width; element.replaceChildren();
        gis.renderButton(element, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', locale, width });
      };
      render(); observer = new ResizeObserver(render); observer.observe(element);
      setReady(true);
      expiry = setTimeout(() => {
        if (submitting.current) return;
        pending.current = null; setLinking(false); setPassword(''); setReady(false); setError('GOOGLE_CHALLENGE_EXPIRED');
      }, Math.max(0, new Date(challenge.expiresAt).getTime() - Date.now()));
    };
    void prepare().catch((cause: unknown) => {
      if (!live) return;
      setError(cause instanceof ApiError ? cause.code ?? 'fallback' : cause instanceof Error ? cause.message : 'fallback');
    });
    return () => { live = false; controller.abort(); observer?.disconnect(); clearTimeout(expiry); pending.current = null; };
  }, [locale, attempt]);

  if (!env.googleLoginEnabled) return null;
  const message = error ? text.errors[error as keyof typeof text.errors] ?? text.errors.fallback : null;
  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label={text.separator}>
      <p className="text-center text-sm text-neutro-600">{text.separator}</p>
      {message && <Alert tone="error">{message}</Alert>}
      <div ref={container} className="mx-auto w-full max-w-[400px] overflow-hidden"
        hidden={!ready || linking || busy || disabled} />
      {!ready && !error && <p role="status" className="text-sm">{text.loading}</p>}
      {busy && <p role="status" className="text-sm">{text.verifying}</p>}
      {linking && (
        <form className="flex flex-col gap-3" onSubmit={(event) => {
          event.preventDefault();
          if (pending.current && password) void finishRef.current(pending.current.credential, pending.current.challenge, password);
        }}>
          <p className="text-sm" role="status">{text.linking}</p>
          <PasswordInput label={text.password} value={password} onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password" maxLength={256} required disabled={busy || disabled} />
          <Button type="submit" isLoading={busy} disabled={disabled || !password}>{text.confirm}</Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => setAttempt((value) => value + 1)}>{text.cancel}</Button>
        </form>
      )}
      {error && !linking && <Button type="button" variant="secondary" disabled={busy || disabled} onClick={() => setAttempt((value) => value + 1)}>{text.retry}</Button>}
      {!linking && <p className="text-xs text-neutro-600">{text.help}</p>}
    </section>
  );
}
