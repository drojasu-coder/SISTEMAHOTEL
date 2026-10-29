import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { cn } from '@/lib/cn';
const focusable = 'a[href],button:not(:disabled),[tabindex="0"]';
export function Popover({ label, trigger, children, role = 'menu', className, triggerClassName, title, showChevron = true }: {
  label: string; trigger?: ReactNode; children: ReactNode | ((close: () => void) => ReactNode);
  title?: string; showChevron?: boolean; role?: 'menu' | 'dialog' | 'listbox'; className?: string; triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const location = useLocation();
  const close = () => { setOpen(false); button.current?.focus({ preventScroll: true }); };
  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('[aria-selected="true"], [aria-checked="true"], ' + focusable)?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const exclusive = (event: Event) => { if ((event as CustomEvent).detail !== id) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('public-popover-open', exclusive);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('public-popover-open', exclusive); };
  }, [open, id]);
  const show = () => { document.dispatchEvent(new CustomEvent('public-popover-open', { detail: id })); setOpen(true); };
  return <div ref={root} className={cn('relative min-w-0', className)} onBlur={event => {
    if (open && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); }
    if (!open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>(focusable) ?? []);
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }}>
    <button ref={button} type="button" title={title} aria-label={label} aria-expanded={open} aria-haspopup={role} aria-controls={open ? id : undefined}
      className={cn('header-control gap-2', triggerClassName)} onClick={() => open ? close() : show()} onKeyDown={event => {
        if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); show(); }
      }}>{trigger ?? label}{showChevron && <Icon name="abajo" className={cn('size-4 transition-transform duration-150', open && 'rotate-180')} />}</button>
    {open && <div ref={panel} id={id} role={role} aria-label={label} className="header-popover absolute right-0 top-full z-50 mt-2 max-h-[65dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-neutro-200 bg-white p-3 shadow-soft" onClick={event => {
      if ((event.target as HTMLElement).closest('a[href], [data-close-popover]')) close();
    }}>{typeof children === 'function' ? children(close) : children}</div>}
  </div>;
}
