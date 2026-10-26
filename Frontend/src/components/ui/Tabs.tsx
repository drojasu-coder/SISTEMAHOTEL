import { useCallback, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export type TabItem = {
  id: string;
  label: string;
  disabled?: boolean;
  content?: ReactNode;
};

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}

/**
 * Tablist accesible.
 * - `aria-selected` y `aria-controls` en cada pestaña.
 * - `tabpanel` asociado con `aria-labelledby`.
 * - Navegación con flechas izquierda/derecha, Home y End.
 * - Las pestañas deshabilitadas se saltan en la navegación por teclado.
 */
export function Tabs({
  items,
  value,
  onChange,
  label = es.comunes.opciones,
  className,
}: TabsProps) {
  const id = useId();
  const [activeId, setActiveId] = useState(value);
  const tablistRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (nextId: string) => {
      setActiveId(nextId);
      onChange(nextId);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const enabled = items.filter((i) => !i.disabled);
      const current = enabled.findIndex((i) => i.id === items[currentIndex].id);
      let next: number;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = enabled.length - 1;
      else next = (current + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
      const nextId = enabled[next].id;
      handleChange(nextId);
      const nextElement = tablistRef.current?.querySelector<HTMLButtonElement>(`[id="${id}-${nextId}"]`);
      nextElement?.focus();
    },
    [items, id, handleChange],
  );

  return (
    <div className={cn(className)}>
      <div
        role="tablist"
        aria-label={label}
        ref={tablistRef}
        className="flex gap-6 overflow-x-auto border-b border-neutro-200"
      >
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          const panelId = `${id}-${item.id}-panel`;
          return (
            <button
              key={item.id}
              id={`${id}-${item.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={item.content ? panelId : undefined}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => handleChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'min-h-12 shrink-0 border-b-2 px-1 py-3 text-xs font-semibold transition-colors disabled:opacity-40',
                isActive
                  ? 'border-bronce-600 text-bronce-700'
                  : 'border-transparent text-neutro-600 hover:text-neutro-900',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) =>
        item.content ? (          <div
            key={item.id}
            id={`${id}-${item.id}-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-${item.id}`}
            hidden={activeId !== item.id}
            tabIndex={0}
            className="pt-6"
          >
            {item.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
