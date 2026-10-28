import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { DataState, type DataStatus } from './DataState';

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
};

export interface TableProps<T extends { id: string }> {
  rows: T[];
  columns: Column<T>[];
  caption: string;
  status?: DataStatus;
  onRetry?: () => void;
  className?: string;
}

/**
 * Tabla de datos.
 * - En pantallas grandes: `<table>` con `<caption>` sr-only.
 * - En móvil: cada fila como lista de definición (`<dl>`).
 * - Soporta estados mediante `DataState` (loading / empty / error / success).
 */
export function Table<T extends { id: string }>({
  rows,
  columns,
  caption,
  status,
  onRetry,
  className,
}: TableProps<T>) {
  return (
    <DataState status={status || (rows.length ? 'success' : 'empty')} onRetry={onRetry}>
      <div className={cn('min-w-0 max-w-full', className)}>
        <div role="region" aria-label={caption} tabIndex={0} className="hidden max-w-full overflow-x-auto rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-bronce-600 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="border-b bg-neutro-50 text-xs text-neutro-600">
              <tr>
                {columns.map((c) => (
                  <th
                    scope="col"
                    key={c.key}
                    className="px-4 py-3 font-medium text-neutro-700"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutro-200 last:border-0 hover:bg-neutro-50/70"
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-4 text-neutro-900">
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 md:hidden" aria-label={caption}>
          {rows.map((row) => (
            <dl
              key={row.id}
              className="flex flex-col gap-3 rounded-lg border p-4 border-neutro-200 bg-white"
            >
              {columns.map((c) => (
                <div key={c.key} className="flex flex-wrap justify-between gap-2">
                  <dt className="text-xs text-neutro-600">{c.label}</dt>
                  <dd className="min-w-0 break-words text-neutro-900">{c.render(row)}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      </div>
    </DataState>
  );
}
