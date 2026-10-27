import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DataState } from '@/components/ui/DataState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button, buttonStyles } from '@/components/ui/Button';
import { ServiceGrid } from './ServiceCard';
import { usePublicInterface } from '@/i18n/public';

export function CatalogSkeleton() {
  return <ServiceGrid>{[1, 2, 3].map((key) => <div key={key} className="surface overflow-hidden"><Skeleton height="aspect-[16/9]" /><div className="space-y-4 p-5"><Skeleton height="h-6" /><Skeleton /><Skeleton height="h-11" /></div></div>)}</ServiceGrid>;
}

export function CatalogState({ loading, error, total, filteredCount, hasFilters, onClear, onRetry, errorTitle, emptyTitle, emptyDescription, children }: {
  loading: boolean; error: boolean; total: number; filteredCount: number; hasFilters: boolean; onClear: () => void; onRetry: () => void; errorTitle: string; emptyTitle: string; emptyDescription: string; children: ReactNode;
}) {
  const { p } = usePublicInterface();
  const filteredEmpty = total > 0;
  return <DataState status={loading ? 'loading' : error ? 'error' : filteredCount === 0 ? 'empty' : 'success'} loadingLabel={p('catalogLoading')} loadingContent={<CatalogSkeleton />}
    errorContent={<ErrorState message={errorTitle} description={p('errorHelp')} retryLabel={p('retry')} loadingLabel={p('catalogLoading')} onRetry={onRetry} />}
    emptyContent={<EmptyState headingLevel={2} title={filteredEmpty ? p('noFilteredResults') : emptyTitle} description={filteredEmpty ? p('adjustFilters') : emptyDescription}
      action={<div className="flex flex-wrap justify-center gap-3">{hasFilters && <Button variant="secondary" onClick={onClear}>{p('resetFilters')}</Button>}<Link to="/sedes" className={buttonStyles({ variant: 'ghost' })}>{p('nextLocations')}</Link></div>} />}>
    {children}
  </DataState>;
}
