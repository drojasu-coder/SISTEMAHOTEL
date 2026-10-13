import { describe, expect, it } from "vitest";
import { createReservaActividadSchema } from "../../src/validators/actividades/reservaActividad.validator";
import { createReservaHabitacionSchema } from "../../src/validators/habitaciones/reservaHabitacion.validator";
import { createReservaMesaSchema } from "../../src/validators/restaurante/reservaMesa.validator";
import { createPagoSchema, resumenPagoQuerySchema } from "../../src/validators/pagos/pago.validator";

describe("reservation and payment validators", () => {
  it("accepts a valid room reservation payload", () => {
    const result = createReservaHabitacionSchema.safeParse({
      habitacion_id: 3,
      fecha_entrada: "2026-11-01",
      fecha_salida: "2026-11-04",
      numero_huespedes: 2,
    });

    expect(result.success).toBe(true);
  });

  it("rejects impossible dates and unknown fields", () => {
    const result = createReservaMesaSchema.safeParse({
      mesa_id: 2,
      fecha: "2026-02-30",
      hora: "19:00",
      numero_comensales: 2,
      extra: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid activity time and invalid payment origin", () => {
    expect(createReservaActividadSchema.safeParse({
      recurso_id: 1,
      fecha: "2026-11-01",
      hora_inicio: "25:00",
      hora_fin: "26:00",
    }).success).toBe(false);

    expect(createPagoSchema.safeParse({
      carrito_id: 1,
      reserva_habitacion_id: 2,
      monto: 100,
      metodo: "efectivo",
      moneda: "GTQ",
    }).success).toBe(true);

    expect(resumenPagoQuerySchema.safeParse({
      carrito_id: "1",
      reserva_habitacion_id: "2",
    }).success).toBe(false);
  });

  it("rejects payment amounts with more than two decimal places", () => {
    expect(createPagoSchema.safeParse({
      carrito_id: 1,
      monto: "10.999",
      metodo: "tarjeta",
      moneda: "GTQ",
    }).success).toBe(false);
  });
});
