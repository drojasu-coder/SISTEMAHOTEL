import { useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { usePublicInterface } from '@/i18n/public';

type Credits = { autor?: string | null; licencia?: string | null; url?: string | null; texto?: string | null };
/** URL efímera entregada por la capa de medios. No se modifica, persiste ni reconstruye. */
export function ServiceMedia({ src, alt, altLang = 'es', credits, priority = false, ratio = 'card' }: {
  src?: string | null; alt?: string; altLang?: string; credits?: Credits | null; priority?: boolean; ratio?: 'card' | 'panorama';
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const { p, locale } = usePublicInterface();
  const visible = Boolean(src && failedSource !== src);
  return <figure className="m-0">
    <div className={cn('w-full overflow-hidden bg-neutro-100', ratio === 'panorama' ? 'aspect-[21/9] sm:aspect-[28/9]' : 'aspect-[16/9]')}>
      {visible ? <img src={src!} alt={alt ?? p('imageUnavailable')} lang={altLang} width={800} height={450} loading={priority ? 'eager' : 'lazy'} onError={() => setFailedSource(src!)} className="h-full w-full object-cover" /> :
        <div role="img" aria-label={p('imageUnavailable')} className="flex h-full items-center justify-center text-neutro-500"><ImageOff className="size-9" aria-hidden="true" /></div>}
    </div>
    {credits && (credits.texto || credits.autor || credits.licencia || credits.url) && <figcaption lang={locale} className="break-words border-b border-neutro-200 px-4 py-2 text-xs text-neutro-600">
      {p('photo')}{' '}{credits.url ? <a href={credits.url} target="_blank" rel="noopener noreferrer" className="underline">{credits.texto || credits.autor || p('photoSource')}</a> : credits.texto || credits.autor}
      {credits.licencia && <> · {credits.licencia}</>}
    </figcaption>}
  </figure>;
}

/** Composición acotada: el consumidor conserva datos, permisos y acción de negocio. */
export function ServiceCard({ name, site, media, facts, price, action, status, headingLevel = 2, selected = false }: {
  name: ReactNode; site?: ReactNode; media: ReactNode; facts?: ReactNode; price?: ReactNode; action: ReactNode; status?: ReactNode; headingLevel?: 2 | 3; selected?: boolean;
}) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return <Card as="article" padding="none" className={cn('flex min-w-0 flex-col overflow-hidden', selected && 'ring-2 ring-selva-600')}>
    {media}
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="space-y-2">
        {site && <p className="text-xs font-medium text-bronce-700" lang="es">{site}</p>}
        <Heading className="font-serif text-xl font-semibold text-neutro-900">{name}</Heading>
        {status}
      </div>
      {facts && <div className="space-y-2 text-sm text-neutro-600">{facts}</div>}
      {price && <div className="border-t border-neutro-200 pt-3 text-sm font-medium text-neutro-900">{price}</div>}
      <div className="mt-auto pt-2">{action}</div>
    </div>
  </Card>;
}

export function ServiceGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
