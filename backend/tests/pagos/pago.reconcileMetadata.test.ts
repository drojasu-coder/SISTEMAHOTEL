import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { stripeService } from "../../src/services/stripe.service";
import { createAuthenticatedUser } from "../helpers/auth";
import { createRecursoActividad } from "../fixtures/actividades";
import { ROLES } from "../../src/constants/roles";

const db = require("../../src/models");
const { Carrito, Pago, CarritoItem, ReservaActividad, ReservaHabitacion, Sucursal, TipoHabitacion, Habitacion } = db;

describe("Reconciliación de metadatos de Stripe y prevención de cobros incompatibles (BE-014)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  let sequence = 0;
  const setupCartWithItem = async () => {
    sequence += 1;
    const clientEmail = `qa-reconcile-${sequence}-${Date.now()}@hotel.test`;
    const user = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: clientEmail,
    });
    const recurso = await createRecursoActividad({
      nombre: `Recurso QA Reconcile ${sequence}`,
      precio_hora: "300.00",
    });
    const reserva = await ReservaActividad.create({
      usuario_id: user.usuario.id,
      recurso_id: recurso.id,
      fecha: "2027-08-10",
      hora_inicio: "10:00:00",
      hora_fin: "11:00:00",
      total: "300.00",
      estado: "confirmada",
    });
    const carrito = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "activo",
      expira_en: new Date(Date.now() + 30 * 60 * 1000),
    });
    await CarritoItem.create({
      carrito_id: carrito.id,
      tipo_item: "actividad",
      referencia_id: reserva.id,
      precio: "300.00",
      cantidad: 1,
    });
    return { user, carrito, reserva };
  };

  it("1. metadatos coincidentes: valida importe, moneda y targets sin requerir llamada extra a Stripe", async () => {
    const { user, carrito } = await setupCartWithItem();
    const updateSpy = vi.spyOn(stripeService, "updatePaymentIntentMetadata");

    vi.spyOn(stripeService, "createPaymentIntent").mockImplementation(async (amount, currency, metadata) => ({
      id: "pi_test_matching_meta",
      client_secret: "pi_secret_matching",
      status: "requires_payment_method",
      amount: 30000,
      currency: "gtq",
      metadata: {
        ...metadata,
      },
    } as any));

    const res = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-matching-${sequence}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.payment_intent_id).toBe("pi_test_matching_meta");
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("2. metadatos ausentes: verifica importe y moneda compatibles y reconcilia pago_id en Stripe", async () => {
    const { user, carrito } = await setupCartWithItem();
    const updateSpy = vi.spyOn(stripeService, "updatePaymentIntentMetadata").mockResolvedValueOnce({} as any);

    vi.spyOn(stripeService, "createPaymentIntent").mockResolvedValueOnce({
      id: "pi_test_missing_meta",
      client_secret: "pi_secret_missing",
      status: "requires_payment_method",
      amount: 30000,
      currency: "gtq",
      metadata: {},
    } as any);

    const res = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-missing-${sequence}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.payment_intent_id).toBe("pi_test_missing_meta");
    expect(updateSpy).toHaveBeenCalledWith("pi_test_missing_meta", {
      pago_id: String(res.body.data.pago_id),
    });
  });

  it("3. metadatos discrepantes: actualiza pago_id en Stripe cuando la operación económica coincide", async () => {
    const { user, carrito } = await setupCartWithItem();
    const updateSpy = vi.spyOn(stripeService, "updatePaymentIntentMetadata").mockResolvedValueOnce({} as any);

    vi.spyOn(stripeService, "createPaymentIntent").mockResolvedValueOnce({
      id: "pi_test_discrepant_meta",
      client_secret: "pi_secret_discrepant",
      status: "requires_payment_method",
      amount: 30000,
      currency: "gtq",
      metadata: {
        pago_id: "99999",
        carrito_id: String(carrito.id),
        tipo_pago: "total",
      },
    } as any);

    const res = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-discrepant-${sequence}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.payment_intent_id).toBe("pi_test_discrepant_meta");
    expect(updateSpy).toHaveBeenCalledWith("pi_test_discrepant_meta", {
      pago_id: String(res.body.data.pago_id),
      carrito_id: String(carrito.id),
      tipo_pago: "total",
    });
  });

  it("4. rechaza intento con importe incompatible (no acepta cobro incompatible aunque falte pago_id)", async () => {
    const { user, carrito } = await setupCartWithItem();

    vi.spyOn(stripeService, "createPaymentIntent").mockResolvedValueOnce({
      id: "pi_test_incompatible_amount",
      client_secret: "pi_secret_bad_amount",
      status: "requires_payment_method",
      amount: 15000, // 150 GTQ en vez de 300 GTQ (30000)
      currency: "gtq",
      metadata: {},
    } as any);

    const res = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-bad-amount-${sequence}`,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("STRIPE_PAYMENT_MISMATCH");
  });

  it("5. rechaza intento con moneda incompatible", async () => {
    const { user, carrito } = await setupCartWithItem();

    vi.spyOn(stripeService, "createPaymentIntent").mockResolvedValueOnce({
      id: "pi_test_incompatible_currency",
      client_secret: "pi_secret_bad_currency",
      status: "requires_payment_method",
      amount: 30000,
      currency: "usd", // USD en vez de GTQ
      metadata: {},
    } as any);

    const res = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-bad-currency-${sequence}`,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("STRIPE_PAYMENT_MISMATCH");
  });

  it("6. rechaza intento asociado a otro carrito en sus metadatos", async () => {
    const { user, carrito } = await setupCartWithItem();

    vi.spyOn(stripeService, "createPaymentIntent").mockResolvedValueOnce({
      id: "pi_test_incompatible_cart",
      client_secret: "pi_secret_bad_cart",
      status: "requires_payment_method",
      amount: 30000,
      currency: "gtq",
      metadata: {
        carrito_id: "8888", // Carrito distinto
      },
    } as any);

    const res = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-bad-cart-${sequence}`,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("STRIPE_PAYMENT_MISMATCH");
  });

  it("7. previene cobros concurrentes incompatibles para una habitación cuando un carrito expirado dejó un intento activo", async () => {
    sequence += 1;
    const clientEmail = `qa-cross-cart-${sequence}-${Date.now()}@hotel.test`;
    const user = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: clientEmail,
    });

    const branch = await Sucursal.create({
      nombre: `Sede Cross Cart ${sequence}`,
      direccion: "Calle 1",
      ciudad: "Guatemala",
    });
    const tipo = await TipoHabitacion.create({
      nombre: `Tipo Cross Cart ${sequence}`,
      tarifa_noche: 450,
      capacidad_maxima: 2,
    });
    const room = await Habitacion.create({
      sucursal_id: branch.id,
      tipo_habitacion_id: tipo.id,
      numero: `C-${sequence}`,
      estado: "disponible",
    });
    const roomReservation = await ReservaHabitacion.create({
      usuario_id: user.usuario.id,
      habitacion_id: room.id,
      fecha_entrada: "2027-09-01",
      fecha_salida: "2027-09-04",
      numero_huespedes: 1,
      total: "450.00",
      estado: "pendiente",
    });

    // Carrito 1: expirado con un pago rechazado cuyo intento en Stripe sigue en requires_payment_method
    const expiredCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "expirado",
      expira_en: new Date(Date.now() - 1000),
    });
    await CarritoItem.create({
      carrito_id: expiredCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });
    const oldPayment = await Pago.create({
      carrito_id: expiredCart.id,
      monto: 450,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "rechazado",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_old_dangling_intent",
    });

    // Carrito 2: nuevo carrito activo del cliente con la misma reserva
    const newCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "activo",
      expira_en: new Date(Date.now() + 30 * 60 * 1000),
    });
    await CarritoItem.create({
      carrito_id: newCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });

    // Stripe reporta que el intento viejo sigue en requires_payment_method
    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_old_dangling_intent",
      status: "requires_payment_method",
    } as any);

    const cancelSpy = vi.spyOn(stripeService, "cancelPaymentIntent").mockResolvedValueOnce({
      id: "pi_test_old_dangling_intent",
      status: "canceled",
    } as any);

    vi.spyOn(stripeService, "createPaymentIntent").mockImplementation(async (amount, currency, metadata) => ({
      id: "pi_test_new_cart_intent",
      client_secret: "pi_secret_new_cart",
      status: "requires_payment_method",
      amount: Math.round(Number(amount) * 100),
      currency: String(currency).toLowerCase(),
      metadata: { ...metadata },
    } as any));

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: newCart.id,
        monto: 450,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-cross-cart-${sequence}`,
      });

    expect(postResponse.status).toBe(201);
    expect(postResponse.body.data.payment_intent_id).toBe("pi_test_new_cart_intent");

    // Verifica que el intento huérfano en Stripe fue efectivamente cancelado
    expect(cancelSpy).toHaveBeenCalledWith("pi_test_old_dangling_intent");

    // Verifica que el pago viejo quedó en estado cancelado en la base de datos
    await oldPayment.reload();
    expect(oldPayment.estado).toBe("cancelado");
  });

  it("8. intento anterior ya aprobado en Stripe: no lo cancela, lo aprueba y bloquea cobro duplicado con 409", async () => {
    sequence += 1;
    const clientEmail = `qa-cross-cart-approved-${sequence}-${Date.now()}@hotel.test`;
    const user = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: clientEmail,
    });

    const branch = await Sucursal.create({
      nombre: `Sede Approved ${sequence}`,
      direccion: "Calle 1",
      ciudad: "Guatemala",
    });
    const tipo = await TipoHabitacion.create({
      nombre: `Tipo Approved ${sequence}`,
      tarifa_noche: 450,
      capacidad_maxima: 2,
    });
    const room = await Habitacion.create({
      sucursal_id: branch.id,
      tipo_habitacion_id: tipo.id,
      numero: `A-${sequence}`,
      estado: "disponible",
    });
    const roomReservation = await ReservaHabitacion.create({
      usuario_id: user.usuario.id,
      habitacion_id: room.id,
      fecha_entrada: "2027-09-01",
      fecha_salida: "2027-09-04",
      numero_huespedes: 1,
      total: "450.00",
      estado: "pendiente",
    });

    const expiredCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "expirado",
      expira_en: new Date(Date.now() - 1000),
    });
    await CarritoItem.create({
      carrito_id: expiredCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });
    const oldPayment = await Pago.create({
      carrito_id: expiredCart.id,
      monto: 450,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "procesando",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_already_succeeded",
    });

    const newCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "activo",
      expira_en: new Date(Date.now() + 30 * 60 * 1000),
    });
    await CarritoItem.create({
      carrito_id: newCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });

    // En Stripe el intento anterior ya figura como succeeded
    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_already_succeeded",
      status: "succeeded",
    } as any);

    const cancelSpy = vi.spyOn(stripeService, "cancelPaymentIntent");

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: newCart.id,
        monto: 450,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-cross-cart-approved-${sequence}`,
      });

    // El cobro en el nuevo carrito debe ser rechazado por saldo agotado
    expect(postResponse.status).toBe(409);
    expect(postResponse.body.code).toBe("PAYMENT_EXCEEDS_BALANCE");

    // No debe intentar cancelar un intento ya aprobado
    expect(cancelSpy).not.toHaveBeenCalled();

    // El intento no fue cancelado ni marcado falsamente como cancelado
    await oldPayment.reload();
    expect(oldPayment.estado).not.toBe("cancelado");
  });

  it("9. intento anterior en processing: no es cancelable y bloquea cobro concurrente con 409", async () => {
    sequence += 1;
    const clientEmail = `qa-cross-cart-processing-${sequence}-${Date.now()}@hotel.test`;
    const user = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: clientEmail,
    });

    const branch = await Sucursal.create({
      nombre: `Sede Processing ${sequence}`,
      direccion: "Calle 1",
      ciudad: "Guatemala",
    });
    const tipo = await TipoHabitacion.create({
      nombre: `Tipo Processing ${sequence}`,
      tarifa_noche: 450,
      capacidad_maxima: 2,
    });
    const room = await Habitacion.create({
      sucursal_id: branch.id,
      tipo_habitacion_id: tipo.id,
      numero: `P-${sequence}`,
      estado: "disponible",
    });
    const roomReservation = await ReservaHabitacion.create({
      usuario_id: user.usuario.id,
      habitacion_id: room.id,
      fecha_entrada: "2027-09-01",
      fecha_salida: "2027-09-04",
      numero_huespedes: 1,
      total: "450.00",
      estado: "pendiente",
    });

    const expiredCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "expirado",
      expira_en: new Date(Date.now() - 1000),
    });
    await CarritoItem.create({
      carrito_id: expiredCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });
    const oldPayment = await Pago.create({
      carrito_id: expiredCart.id,
      monto: 450,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "rechazado",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_processing_stripe",
    });

    const newCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "activo",
      expira_en: new Date(Date.now() + 30 * 60 * 1000),
    });
    await CarritoItem.create({
      carrito_id: newCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });

    // En Stripe el intento está en processing (in-flight)
    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_processing_stripe",
      status: "processing",
    } as any);

    const cancelSpy = vi.spyOn(stripeService, "cancelPaymentIntent");

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: newCart.id,
        monto: 450,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-cross-cart-proc-${sequence}`,
      });

    expect(postResponse.status).toBe(409);
    expect(postResponse.body.code).toBe("PAYMENT_EXCEEDS_BALANCE");
    expect(cancelSpy).not.toHaveBeenCalled();

    // El pago previo NO fue marcado como cancelado
    await oldPayment.reload();
    expect(oldPayment.estado).not.toBe("cancelado");
  });

  it("10. fallo o incertidumbre al cancelar en Stripe: no marca cancelado y previene cobro incompatible", async () => {
    sequence += 1;
    const clientEmail = `qa-cross-cart-fail-${sequence}-${Date.now()}@hotel.test`;
    const user = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: clientEmail,
    });

    const branch = await Sucursal.create({
      nombre: `Sede Fail ${sequence}`,
      direccion: "Calle 1",
      ciudad: "Guatemala",
    });
    const tipo = await TipoHabitacion.create({
      nombre: `Tipo Fail ${sequence}`,
      tarifa_noche: 450,
      capacidad_maxima: 2,
    });
    const room = await Habitacion.create({
      sucursal_id: branch.id,
      tipo_habitacion_id: tipo.id,
      numero: `F-${sequence}`,
      estado: "disponible",
    });
    const roomReservation = await ReservaHabitacion.create({
      usuario_id: user.usuario.id,
      habitacion_id: room.id,
      fecha_entrada: "2027-09-01",
      fecha_salida: "2027-09-04",
      numero_huespedes: 1,
      total: "450.00",
      estado: "pendiente",
    });

    const expiredCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "expirado",
      expira_en: new Date(Date.now() - 1000),
    });
    await CarritoItem.create({
      carrito_id: expiredCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });
    const oldPayment = await Pago.create({
      carrito_id: expiredCart.id,
      monto: 450,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "rechazado",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_cancel_fails",
    });

    const newCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "activo",
      expira_en: new Date(Date.now() + 30 * 60 * 1000),
    });
    await CarritoItem.create({
      carrito_id: newCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });

    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_cancel_fails",
      status: "requires_payment_method",
    } as any);

    // Simula fallo de red hacia Stripe al intentar cancelar
    vi.spyOn(stripeService, "cancelPaymentIntent").mockRejectedValueOnce(
      new Error("Stripe network timeout"),
    );

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: newCart.id,
        monto: 450,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-cross-cart-fail-${sequence}`,
      });

    // Al no poder confirmar la cancelación, se protege el saldo y se rechaza el cobro adicional
    expect(postResponse.status).toBe(409);
    expect(postResponse.body.code).toBe("PAYMENT_EXCEEDS_BALANCE");

    // El pago previo NO debe quedar como cancelado ante fallo o incertidumbre
    await oldPayment.reload();
    expect(oldPayment.estado).not.toBe("cancelado");
  });

  it("11. reconcilia a cancelado si Stripe ya lo canceló tras una transacción local previa", async () => {
    sequence += 1;
    const clientEmail = `qa-cross-cart-reconcile-${sequence}-${Date.now()}@hotel.test`;
    const user = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: clientEmail,
    });

    const branch = await Sucursal.create({
      nombre: `Sede Reconcile ${sequence}`,
      direccion: "Calle 1",
      ciudad: "Guatemala",
    });
    const tipo = await TipoHabitacion.create({
      nombre: `Tipo Reconcile ${sequence}`,
      tarifa_noche: 450,
      capacidad_maxima: 2,
    });
    const room = await Habitacion.create({
      sucursal_id: branch.id,
      tipo_habitacion_id: tipo.id,
      numero: `R-${sequence}`,
      estado: "disponible",
    });
    const roomReservation = await ReservaHabitacion.create({
      usuario_id: user.usuario.id,
      habitacion_id: room.id,
      fecha_entrada: "2027-09-01",
      fecha_salida: "2027-09-04",
      numero_huespedes: 1,
      total: "450.00",
      estado: "pendiente",
    });

    const expiredCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "expirado",
      expira_en: new Date(Date.now() - 1000),
    });
    await CarritoItem.create({
      carrito_id: expiredCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });
    const oldPayment = await Pago.create({
      carrito_id: expiredCart.id,
      monto: 450,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "rechazado",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_already_canceled_stripe",
    });

    const newCart = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "activo",
      expira_en: new Date(Date.now() + 30 * 60 * 1000),
    });
    await CarritoItem.create({
      carrito_id: newCart.id,
      tipo_item: "habitacion",
      referencia_id: roomReservation.id,
      precio: "450.00",
      cantidad: 1,
    });

    // En Stripe el intento ya figura como canceled
    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_already_canceled_stripe",
      status: "canceled",
    } as any);

    vi.spyOn(stripeService, "createPaymentIntent").mockImplementation(async (amount, currency, metadata) => ({
      id: "pi_test_new_cart_intent_reconciled",
      client_secret: "pi_secret_new_cart_reconciled",
      status: "requires_payment_method",
      amount: Math.round(Number(amount) * 100),
      currency: String(currency).toLowerCase(),
      metadata: { ...metadata },
    } as any));

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: newCart.id,
        monto: 450,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `key-cross-cart-rec-${sequence}`,
      });

    expect(postResponse.status).toBe(201);
    expect(postResponse.body.data.payment_intent_id).toBe("pi_test_new_cart_intent_reconciled");

    await oldPayment.reload();
    expect(oldPayment.estado).toBe("cancelado");
  });
});
