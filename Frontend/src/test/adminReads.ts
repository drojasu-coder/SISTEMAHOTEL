import { vi } from 'vitest';
import { jsonResponse } from './renderWithProviders';

/** Endpoint-specific auxiliary fixtures. Auth responses remain owned by each test. */
export function installAdminReadMocks(role = 'admin') {
  const authOrModuleFetch = global.fetch;
  global.fetch = vi.fn(async (input, init) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname.endsWith('/sucursales') || url.pathname.endsWith('/tipos-habitacion') || url.pathname.endsWith('/habitaciones')) return jsonResponse({ data: [] });
    if (url.pathname.endsWith('/inicio')) return jsonResponse({ data: {} });
    if (url.pathname.endsWith('/admin/dashboard')) {
      if (url.searchParams.get('vista') === 'alcance') return jsonResponse({ data: { global: role === 'admin', sedes: [] } });
      return jsonResponse({ data: {
        fecha_consulta: '2026-10-27', consultado_en: '2026-10-27T18:00:00.000Z', sucursal_filtro: null,
        resumen: { total_habitaciones: 0, habitaciones_disponibles: 0, habitaciones_ocupadas: 0, habitaciones_mantenimiento: 0,
          habitaciones_limpieza: 0, habitaciones_otro_estado: 0, porcentaje_ocupacion: null, reservas_activas: 0, llegadas_hoy: 0, salidas_hoy: 0, reservas_pendientes: 0 },
        llegadas: [], salidas: [], reservas_recientes: [], pendientes_atencion: [],
      } });
    }
    return authOrModuleFetch(input, init);
  });
}
