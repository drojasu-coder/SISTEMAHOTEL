import { useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/** La URL conserva el catálogo; el panel añade únicamente el recurso elegido. */
export function useServiceSelection<T extends { id?: number }>(items: T[], settled: boolean) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const raw = params.get('recurso');
  const id = raw && /^[1-9]\d*$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : null;
  const retained = useRef<T | null>(null);
  const found = items.find((item) => item.id === id);
  // Un cambio de sede no borra un formulario abierto ni reasigna su recurso.
  if (!id) retained.current = null;
  else if (found) retained.current = found;
  else if (retained.current?.id !== id) retained.current = null;
  const selected = found ?? retained.current;
  const select = (item: T) => {
    const next = new URLSearchParams(params);
    next.set('recurso', String(item.id));
    navigate({ search: next.toString(), hash: location.hash }, {
      state: { ...location.state, servicePanelOrigin: location.pathname + location.search + location.hash },
      preventScrollReset: true,
    });
  };
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete('recurso');
    const target = location.pathname + (next.size ? `?${next}` : '') + location.hash;
    if (location.state?.servicePanelOrigin === target) navigate(-1);
    else navigate(target, { replace: true, preventScrollReset: true });
  };
  return { selected, select, close, missing: Boolean(raw !== null && settled && !selected) };
}
