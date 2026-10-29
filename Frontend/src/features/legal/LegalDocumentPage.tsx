import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { formatAdminCalendarDate } from '@/features/admin-core/adminDates';
import { LEGAL_ORDER, LEGAL_ROUTES, LEGAL_UPDATED_AT } from './routes';
import type { LegalBlock, LegalSlug } from './types';
import { useLegalDocuments } from './useLegalDocuments';

const Block: React.FC<{ block: LegalBlock }> = ({ block }) =>
  block.list ? (
    <ul className="list-disc space-y-2 pl-5 marker:text-bronce-600">
      {block.list.map((item) => <li key={item}>{item}</li>)}
    </ul>
  ) : (
    <p>{block.p}</p>
  );

/**
 * Documento legal público: índice navegable, fecha de actualización y enlaces relacionados.
 */
export const LegalDocumentPage: React.FC<{ slug: LegalSlug }> = ({ slug }) => {
  const { locale, docs, ui } = useLegalDocuments();
  const doc = docs[slug];

  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} · HOTEL HUNAHPÚ`;
    return () => { document.title = previous; };
  }, [doc.title]);

  const tocId = `legal-toc-${slug}`;
  return (
    <PageContainer lang={locale} className="max-w-6xl">
      <PageHeader
        eyebrow={ui.eyebrow}
        title={doc.title}
        description={doc.description}
        context={
          <p className="text-xs text-neutro-600">
            {ui.updated}: <time dateTime={LEGAL_UPDATED_AT}>{formatAdminCalendarDate(LEGAL_UPDATED_AT, locale)}</time>
          </p>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-labelledby={tocId} className="lg:sticky lg:top-28 lg:self-start">
          <h2 id={tocId} className="!text-sm font-semibold uppercase tracking-wider text-neutro-700">{ui.contents}</h2>
          <ol className="mt-3 space-y-1 border-l border-neutro-200 text-sm">
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="-ml-px flex min-h-11 items-center border-l-2 border-transparent py-1.5 pl-3 text-neutro-700 hover:border-bronce-500 hover:text-neutro-900 focus-visible:border-bronce-600">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 space-y-10 text-[0.95rem] leading-relaxed text-neutro-800">
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`} className="scroll-mt-28 space-y-3">
              <h2 id={`${section.id}-titulo`} className="font-serif text-xl font-semibold text-neutro-900 md:text-2xl">{section.title}</h2>
              {section.blocks.map((block, index) => <Block key={index} block={block} />)}
            </section>
          ))}

          <nav aria-labelledby={`legal-related-${slug}`} className="border-t border-neutro-200 pt-6">
            <h2 id={`legal-related-${slug}`} className="!text-sm font-semibold uppercase tracking-wider text-neutro-700">{ui.related}</h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {LEGAL_ORDER.filter((other) => other !== slug).map((other) => (
                <li key={other}>
                  <Link to={LEGAL_ROUTES[other]} className="inline-flex min-h-11 items-center font-medium text-bronce-700 underline hover:text-bronce-900">
                    {docs[other].title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button type="button" onClick={() => window.scrollTo({ top: 0 })} className="inline-flex min-h-11 items-center text-xs text-neutro-600 underline hover:text-neutro-900">
            {ui.backToTop}
          </button>
        </article>
      </div>
    </PageContainer>
  );
};
