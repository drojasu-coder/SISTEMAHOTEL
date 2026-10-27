
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
}: PaginationProps) {
  if (totalPages < 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );

  return (
    <nav
      aria-label={es.comunes.pagina}
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      <p className="text-xs text-neutro-600">
        {es.comunes.pagina} {page} {es.comunes.de} {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={es.comunes.anterior}
        >
          <span className="sr-only">{es.comunes.anterior}</span>
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
          aria-label={es.comunes.siguiente}
        >
          <span className="sr-only">{es.comunes.siguiente}</span>
          <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </nav>
  );
}
