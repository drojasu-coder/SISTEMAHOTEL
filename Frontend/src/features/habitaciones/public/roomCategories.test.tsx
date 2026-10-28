import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { HabitacionesDisponiblesList } from '@/features/crear-reserva/components/HabitacionesDisponiblesList';
import type { HabitacionDisponiblePublico } from '../types';
import { groupByCategory, hasSiteTypes, typesForSite } from './roomCategories';

const unidad = (id: number, tipoId: number, nombre: string, sede = 1): HabitacionDisponiblePublico => ({
  id, tipo: { id: tipoId, nombre, sucursal_id: sede, descripcion: null, capacidad_maxima: 2, tarifa_noche: '1250.00', imagen_url: null, imagen_creditos: null },
  sucursal: { id: sede, nombre: 'Hotel Hunahpú Antigua' }, imagen_url: null, imagen_creditos: null, noches: 2, tarifa_noche: '1250.00', total_estimado: '2500.00',
});

describe('Categorías comerciales de habitaciones', () => {
  it('agrupa unidades por id de tipo y elige como representante la de menor id', () => {
    const grupos = groupByCategory([unidad(30, 2, 'Deluxe Twin'), unidad(12, 1, 'Deluxe King'), unidad(5, 1, 'Deluxe King')]);
    expect(grupos.map((g) => [g.representative.id, g.rooms.length])).toEqual([[5, 2], [30, 1]]);
  });

  it('filtra tipos por sucursal_id (no por texto), usa el nombre comercial y excluye los tipos sin sede', () => {
    const tipos = [
      { id: 1, nombre: 'Doble', sucursal_id: null },
      { id: 32, nombre: 'Deluxe King · Antigua', nombre_comercial: 'Deluxe King', sucursal_id: 1 },
      { id: 39, nombre: 'Deluxe King · Atitlán', nombre_comercial: 'Deluxe King', sucursal_id: 2 },
      // Aunque el texto diga "Antigua", la sede real es la 2: manda el id.
      { id: 50, nombre: 'Suite · Antigua', nombre_comercial: 'Suite', sucursal_id: 2 },
    ];
    expect(typesForSite(tipos, 1).map((t) => [t.id, t.nombre])).toEqual([[32, 'Deluxe King']]);
    expect(typesForSite(tipos, 2).map((t) => t.id)).toEqual([39, 50]);
    expect(typesForSite(tipos, 'all')).toEqual([]);
    expect(hasSiteTypes(tipos)).toBe(true);
    expect(hasSiteTypes([{ nombre: 'Doble' }])).toBe(false);
  });

  it('los resultados de /reservar muestran una tarjeta por categoría con la cantidad real y seleccionan una unidad disponible', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<HabitacionesDisponiblesList habitaciones={[unidad(7, 1, 'Deluxe King'), unidad(8, 1, 'Deluxe King'), unidad(9, 1, 'Deluxe King'), unidad(20, 3, 'Premium')]} isLoading={false} criteriaChanged={false} onSelectHabitacion={onSelect} />);
    const tarjetas = screen.getAllByRole('article');
    expect(tarjetas).toHaveLength(2);
    expect(within(tarjetas[0]).getByText('3 habitaciones disponibles')).toBeInTheDocument();
    expect(within(tarjetas[1]).getByText('1 habitación disponible')).toBeInTheDocument();
    await userEvent.click(within(tarjetas[0]).getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });
});
