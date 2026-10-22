import { describe, expect, it } from 'vitest';
import {
  descripcionItem,
  esItemHabitacion,
  etiquetaTipoItem,
  formatearCantidad,
  formatearGTQ,
  textosCarrito,
} from './textos';

describe('Presentación del carrito', () => {
  it('formatea importes en GTQ con dos decimales sin recalcularlos', () => {
    expect(formatearGTQ(1234)).toBe('Q1,234.00');
    expect(formatearGTQ('2750.5')).toBe('Q2,750.50');
    expect(formatearGTQ(0)).toBe('Q0.00');
  });

  it('no inventa un importe cuando el servidor no entrega un valor válido', () => {
    expect(formatearGTQ(null)).toBe(textosCarrito.noDisponible);
    expect(formatearGTQ(undefined)).toBe(textosCarrito.noDisponible);
    expect(formatearGTQ('')).toBe(textosCarrito.noDisponible);
    expect(formatearGTQ('no-es-un-monto')).toBe(
      textosCarrito.noDisponible,
    );
  });

  it('presenta la cantidad registrada por el servidor', () => {
    expect(formatearCantidad(1)).toBe('1');
    expect(formatearCantidad(0)).toBe('0');
    expect(formatearCantidad(Number.NaN)).toBe(
      textosCarrito.noDisponible,
    );
  });

  it('etiqueta cada tipo real y no confunde los demás con habitaciones', () => {
    expect(etiquetaTipoItem('habitacion')).toBe('Habitación');
    expect(etiquetaTipoItem('evento')).toBe('Evento');
    expect(etiquetaTipoItem('boleto_parque')).toBe('Boleto de parque');
    expect(etiquetaTipoItem('tipo-desconocido')).toBe(
      textosCarrito.tipoOtro,
    );
    expect(esItemHabitacion({ tipo_item: 'habitacion' })).toBe(true);
    expect(esItemHabitacion({ tipo_item: 'evento' })).toBe(false);
  });

  it('usa un identificador claro cuando falta la descripción del servidor', () => {
    expect(
      descripcionItem({ id: 77, descripcion: '   ' }),
    ).toBe(textosCarrito.sinDescripcion(77));
    expect(
      descripcionItem({ id: 77, descripcion: 'Reserva de habitación #12' }),
    ).toBe('Reserva de habitación #12');
  });
});
