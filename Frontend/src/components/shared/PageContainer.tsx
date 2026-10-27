import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageContainer({ variant = 'public', className, ...props }: ComponentPropsWithoutRef<'section'> & { variant?: 'public' | 'admin' }) {
  return <section {...props} className={cn(variant === 'public' ? 'mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8' : 'flex w-full min-w-0 flex-col gap-6', className)} />;
}

export function PageHeader({ eyebrow, title, description, action, context, breadcrumbs }: {
  eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; context?: ReactNode; breadcrumbs?: ReactNode;
}) {
  return <div className="flex flex-col gap-4">
    {breadcrumbs}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-serif text-[2rem] font-semibold leading-tight text-neutro-900 md:text-[2.5rem]">{title}</h1>
        {description && <p className="max-w-3xl text-sm text-neutro-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {context}
  </div>;
}
