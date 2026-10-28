import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Routes } from 'react-router-dom';
import { renderPublicWithProviders, jsonResponse } from '@/test/renderWithProviders';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { Footer } from '@/components/shared/Footer';
import { inicioApi } from '@/features/inicio/api/inicioApi';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import type { InicioData } from '@/features/inicio/types';
import { legalEs } from './content.es';
import { legalEn } from './content.en';
import { LegalNotice } from './LegalNotice';
import { legalRoutes } from './legalRoutes';
import { LEGAL_ORDER, LEGAL_ROUTES } from './routes';

const mount = (ui: React.ReactElement, route = '/') =>
  renderPublicWithProviders(<LocaleProvider>{ui}</LocaleProvider>, { route });
const legalApp = (route: string) => mount(<Routes>{legalRoutes()}</Routes>, route);

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); tokenStorage.clear();
  localStorage.setItem('hunahpu.public-site.v1', 'all');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue([]);
  vi.spyOn(inicioApi, 'getContent').mockResolvedValue({ contacto_visible: false } as InicioData);
  global.fetch = vi.fn(async () => jsonResponse({ data: [] }));
});
afterEach(() => { vi.restoreAllMocks(); });

describe('Documentos legales públicos', () => {
  it.each(LEGAL_ORDER)('%s abre sin sesión en español con índice navegable, fecha y aviso académico', (slug) => {
    localStorage.setItem('hunahpu.language.v1', 'es');
    legalApp(LEGAL_ROUTES[slug]);
    const doc = legalEs[slug];
    expect(screen.getByRole('heading', { level: 1, name: doc.title })).toBeInTheDocument();
    expect(screen.getByText(/Última actualización/)).toHaveTextContent('27 oct 2026');
    expect(screen.getByText('Proyecto académico')).toBeInTheDocument();
    const toc = screen.getByRole('navigation', { name: 'En esta página' });
    const anchors = within(toc).getAllByRole('link');
    expect(anchors).toHaveLength(doc.sections.length);
    for (const [index, section] of doc.sections.entries()) {
      expect(anchors[index]).toHaveAttribute('href', `#${section.id}`);
      expect(document.getElementById(section.id)).not.toBeNull();
    }
    const related = within(screen.getByRole('navigation', { name: 'Otros documentos' })).getAllByRole('link');
    expect(related.map((a) => a.getAttribute('href')).sort()).toEqual(
      LEGAL_ORDER.filter((other) => other !== slug).map((other) => LEGAL_ROUTES[other]).sort(),
    );
  });

  it.each(LEGAL_ORDER)('%s se muestra en inglés', (slug) => {
    localStorage.setItem('hunahpu.language.v1', 'en');
    legalApp(LEGAL_ROUTES[slug]);
    expect(screen.getByRole('heading', { level: 1, name: legalEn[slug].title })).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toHaveTextContent('Oct 27, 2026');
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
  });

  it('español e inglés tienen las mismas secciones y la misma estructura de bloques', () => {
    for (const slug of LEGAL_ORDER) {
      const es = legalEs[slug].sections; const en = legalEn[slug].sections;
      expect(en.map((s) => s.id)).toEqual(es.map((s) => s.id));
      es.forEach((section, i) => {
        expect(en[i].blocks.map((b) => (b.list ? `list:${b.list.length}` : 'p'))).toEqual(
          section.blocks.map((b) => (b.list ? `list:${b.list.length}` : 'p')),
        );
      });
    }
  });

  it('el contenido no promete reembolsos automáticos, cobros reales ni cumplimiento no verificado', () => {
    const text = JSON.stringify([legalEs, legalEn]).toLowerCase();
    for (const forbidden of ['cumple con el rgpd', 'gdpr compliant', 'reembolso automático garantizado', 'pci dss', 'certificado por inguat', 'registered with inguat.']) {
      expect(text).not.toContain(forbidden);
    }
    expect(text).toContain('modo de prueba');
    expect(text).not.toMatch(/(?<!no )se realizan cargos reales|(?<!no )real charges are made/);
    expect(text).toContain('test mode');
  });

  it('el pie de página enlaza los cinco documentos', async () => {
    localStorage.setItem('hunahpu.language.v1', 'es');
    mount(<Footer />);
    const legal = within(screen.getByRole('contentinfo')).getByRole('navigation', { name: 'Información legal' });
    const hrefs = within(legal).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(LEGAL_ORDER.map((slug) => LEGAL_ROUTES[slug]));
  });

  it('el aviso de reserva y pago es informativo: enlaces, sin casilla de aceptación', () => {
    localStorage.setItem('hunahpu.language.v1', 'es');
    mount(<LegalNotice />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', LEGAL_ROUTES.terminos);
    expect(screen.getByRole('link', { name: 'Política de privacidad' })).toHaveAttribute('href', LEGAL_ROUTES.privacidad);
    expect(screen.getByRole('link', { name: 'Reservas, cancelaciones y reembolsos' })).toHaveAttribute('href', LEGAL_ROUTES.reservas);
  });
});
