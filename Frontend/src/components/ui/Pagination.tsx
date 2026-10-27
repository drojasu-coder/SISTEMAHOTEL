
import React from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { es } from '@/i18n/es';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  labels?: { page: string; of: string; previous: string; next: string };
}

/**
 * Paginación presentacional (no implementa paginación de servidor).
 * - Página actual con `aria-current="page"`.
 * - Puntos suspensivos cuando hay saltos.
 * - Flechas anterior/siguiente con `aria-label`.
 * - Deshabilitable globalmente.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  disabled,
  className,
  labels = { page: es.comunes.pagina, of: es.comunes.de, previous: es.comunes.anterior, next: es.comunes.siguiente },
}: PaginationProps) {
  if (totalPages < 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );

  return (
    <nav
      aria-label={labels.page}
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      <p className="text-xs text-neutro-600">
        {labels.page} {page} {labels.of} {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={labels.previous}
        >
          <span className="sr-only">{labels.previous}</span>
          <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        {pages.map((n, i) => {
          const prev = pages[i - 1];
          const showEllipsis = i > 0 && n > prev! + 1;
          return (
            <React.Fragment key={n}>
              {showEllipsis && <span aria-hidden="true" className="text-xs text-neutro-500">…</span>}
              <Button
                variant={page === n ? 'primary' : 'ghost'}
                size="sm"
                aria-current={page === n ? 'page' : undefined}
                disabled={disabled}
                onClick={() => onChange(n)}
              >
                {n}
              </Button>
            </React.Fragment>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label={labels.next}
        >
          <span className="sr-only">{labels.next}</span>
          <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </nav>
  );
}
