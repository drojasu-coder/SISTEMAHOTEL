import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
export const PublicDropdown: React.FC<React.PropsWithChildren<{ label: string; active?: boolean }>> = ({ label, active, children }) => {
  const ref = useRef<HTMLDetailsElement>(null);
  const location = useLocation();
  useEffect(() => { ref.current?.removeAttribute('open'); }, [location]);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) ref.current?.removeAttribute('open'); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return <details ref={ref} className="relative" onKeyDown={(e) => {
    if (e.key === 'Escape' && ref.current?.open) { e.stopPropagation(); ref.current.open = false; ref.current.querySelector('summary')?.focus(); }
  }} onToggle={() => {
    if (ref.current?.open) document.querySelectorAll<HTMLDetailsElement>('header details[open]').forEach((el) => { if (el !== ref.current) el.open = false; });
  }}>
    <summary className={`flex min-h-11 list-none items-center gap-1 rounded px-2 text-xs font-semibold ${active ? 'text-bronce-700 underline' : ''}`}><span className="max-w-36 truncate">{label}</span><span aria-hidden="true">⌄</span></summary>
    <div className="absolute right-0 top-full z-40 flex min-w-48 flex-col gap-1 rounded-lg border bg-white p-2 shadow-soft">{children}</div>
  </details>;
};
