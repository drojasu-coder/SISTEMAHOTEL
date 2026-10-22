import { describe, expect, it } from 'vitest';
import {
  calcularNoches,
  formatFechaCalendario,
  formatGTQ,
  parseReservaId,
  reservaNecesitaCatalogoSedes,
  resolverNombreSede,
} from './formato';
import { crearHabitacion, crearReserva } from './test-utils';

describe('formato de reservas propias', () => {
  it('valida el ID antes de consultar: solo enteros positivos seguros', () => {
    expect(parseReservaId('12')).toBe(12);
    expect(parseReservaId(' 7 ')).toBe(7);

    for (const invalido of [
      undefined,
      '',
      '0',
      '-3',
      '1.5',
      '12abc',
      'abc',
      '9007199254740993',
    ]) {
      expect(parseReservaId(invalido)).toBeNull();
    }
  });

  it('presenta fechas de calendario sin desplazar el día', () => {
    expect(formatFechaCalendario('2026-12-05')).toBe('5 dic 2026');
    expect(formatFechaCalendario('2026-01-01')).toBe('1 ene 2026');
    expect(formatFechaCalendario('texto')).toBe('texto');
  });

  it('calcula noches con diferencias de calendario, incluso en cambios de horario', () => {
    expect(calcularNoches('2026-12-05', '2026-12-09')).toBe(4);
    expect(calcularNoches('2026-03-08', '2026-03-09')).toBe(1);
    expect(calcularNoches('2026-12-09', '2026-12-05')).toBeNull();
    expect(calcularNoches('2026-12-05', '2026-12-05')).toBeNull();
    expect(calcularNoches('fecha', '2026-12-09')).toBeNull();
  });

  it('formatea GTQ sin recalcular ni inventar importes', () => {
    expect(formatGTQ('2750.5')).toBe('Q2,750.50');
    expect(formatGTQ(0)).toBe('Q0.00');
    expect(formatGTQ(null)).toBeNull();
    expect(formatGTQ('')).toBeNull();
    expect(formatGTQ('no-es-un-monto')).toBeNull();
  });

  it('decide cuándo hace falta el catálogo de sedes y usa el identificador como respaldo', () => {
    const conSede = crearReserva();
    expect(reservaNecesitaCatalogoSedes(conSede)).toBe(false);
    expect(resolverNombreSede(conSede, new Map())).toBe(
      'Hotel Hunapú Antigua',
    );

    const sinRelacion = crearReserva({
      Habitacion: crearHabitacion({ Sucursal: undefined }),
    });
    expect(reservaNecesitaCatalogoSedes(sinRelacion)).toBe(true);
    expect(resolverNombreSede(sinRelacion, new Map())).toBe('Sede #1');
    expect(
      resolverNombreSede(
        sinRelacion,
        new Map([[1, 'Hotel Hunapú Atitlán']]),
      ),
    ).toBe('Hotel Hunapú Atitlán');

    const sinHabitacion = crearReserva({ Habitacion: undefined });
    expect(reservaNecesitaCatalogoSedes(sinHabitacion)).toBe(false);
    expect(resolverNombreSede(sinHabitacion, new Map())).toBe(
      'Sede no disponible',
    );
  });
});
