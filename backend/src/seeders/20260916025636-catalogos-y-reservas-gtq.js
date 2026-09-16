"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const fechas = { createdAt: new Date(), updatedAt: new Date() };

   
    try {
      await queryInterface.bulkInsert("usuarios", [{ nombre: "Admin", email: "admin@test.com", password_hash: "123", rol: "admin", activo: true, ...fechas }], {});
      await queryInterface.bulkInsert("sucursales", [{ nombre: "Hotel Central", direccion: "Guate", ciudad: "Guate", activa: true, ...fechas }], {});
      await queryInterface.bulkInsert("tipos_habitacion", [{ nombre: "Suite", capacidad_maxima: 2, tarifa_noche: 1000.00, ...fechas }], {});
      await queryInterface.bulkInsert("servicios_evento", [{ nombre: "Musica", precio: 500.00, ...fechas }], {});
      await queryInterface.bulkInsert("instructores", [{ nombre: "Juan", especialidad: "Gym", activo: true, ...fechas }], {});
      await queryInterface.bulkInsert("terapeutas", [{ nombre: "Maria", activo: true, ...fechas }], {});
      await queryInterface.bulkInsert("servicios_bienestar", [{ nombre: "Masaje", duracion_minutos: 60, precio: 300.00, ...fechas }], {});
      await queryInterface.bulkInsert("choferes", [{ nombre: "Pedro", licencia: "A", activo: true, ...fechas }], {});
      await queryInterface.bulkInsert("vehiculos", [{ tipo: "Van", capacidad: 10, placa: "123", ...fechas }], {});
      await queryInterface.bulkInsert("promociones", [{ nombre: "Promo", tipo_descuento: "fijo", valor_descuento: 10.00, fecha_inicio: "2026-01-01", fecha_fin: "2026-12-31", ...fechas }], {});
      await queryInterface.bulkInsert("proveedores", [{ nombre: "Prov 1", nit: "123", ...fechas }], {});

      // Hijos de sucursal
      await queryInterface.bulkInsert("habitaciones", [{ sucursal_id: 1, tipo_habitacion_id: 1, numero: "101", estado: "disponible", ...fechas }], {});
      await queryInterface.bulkInsert("parqueos", [{ sucursal_id: 1, numero: "A1", estado: "disponible", ...fechas }], {});
      await queryInterface.bulkInsert("salones", [{ sucursal_id: 1, nombre: "Salon 1", capacidad_maxima: 100, tarifa_base: 5000.00, ...fechas }], {});
      await queryInterface.bulkInsert("mesas", [{ sucursal_id: 1, zona: "Terraza", capacidad: 4, estado: "disponible", ...fechas }], {});
      await queryInterface.bulkInsert("recursos_actividad", [{ sucursal_id: 1, tipo: "Aventura", nombre: "Tour", ...fechas }], {});
      await queryInterface.bulkInsert("amenidades", [{ sucursal_id: 1, nombre: "Piscina", aforo_maximo: 20, ...fechas }], {});

      console.log("[EXITO] FASE 1: Catalogos inyectados correctamente.");
    } catch (error) {
      console.log("[ERROR] Fase 1 (Catalogos):", error.message);
    }



    // 1. BOLETOS PARQUE (esta ya te funcionaba)
    try {
      await queryInterface.bulkInsert("boletos_parque", [{
        usuario_id: 1,
        fecha_visita: "2026-10-01",
        tipo_boleto: "Pase VIP",
        precio: 250.00,
        estado: "valido",
        ...fechas,
      }], {});
      console.log("[EXITO] Boleto Parque inyectado.");
    } catch (e) { console.log("[ERROR] boletos_parque:", e.message); }

    // 2. RESERVAS MESA -> faltaban fecha, hora, numero_comensales (NOT NULL)
    try {
      await queryInterface.bulkInsert("reservas_mesa", [{
        usuario_id: 1,
        mesa_id: 1,
        fecha: "2026-10-10",
        hora: "19:30:00",
        numero_comensales: 4,
        estado: "pendiente",
        ...fechas,
      }], {});
      console.log("[EXITO] Reserva Mesa inyectada.");
    } catch (e) { console.log("[ERROR] reservas_mesa:", e.message); }

    // 3. RESERVAS ACTIVIDAD -> la columna real es "recurso_id", no "recurso_actividad_id"
    //    y faltaban fecha/hora_inicio/hora_fin (NOT NULL)
    try {
      await queryInterface.bulkInsert("reservas_actividad", [{
        usuario_id: 1,
        recurso_id: 1,
        instructor_id: 1,
        fecha: "2026-10-12",
        hora_inicio: "09:00:00",
        hora_fin: "10:00:00",
        con_equipo: false,
        estado: "confirmada",
        ...fechas,
      }], {});
      console.log("[EXITO] Reserva Actividad inyectada.");
    } catch (e) { console.log("[ERROR] reservas_actividad:", e.message); }

    // 4. RESERVAS AMENIDAD -> faltaban fecha, franja_horaria (NOT NULL)
    try {
      await queryInterface.bulkInsert("reservas_amenidad", [{
        usuario_id: 1,
        amenidad_id: 1,
        fecha: "2026-10-14",
        franja_horaria: "10:00-12:00",
        mobiliario: "Reposera",
        estado: "confirmada",
        ...fechas,
      }], {});
      console.log("[EXITO] Reserva Amenidad inyectada.");
    } catch (e) { console.log("[ERROR] reservas_amenidad:", e.message); }

    // 5. CITAS BIENESTAR -> la columna real es "servicio_bienestar_id", no "servicio_spa_id"
    //    y faltaban fecha/hora_inicio/hora_fin (NOT NULL)
    try {
      await queryInterface.bulkInsert("citas_bienestar", [{
        usuario_id: 1,
        servicio_bienestar_id: 1,
        terapeuta_id: 1,
        fecha: "2026-10-16",
        hora_inicio: "15:00:00",
        hora_fin: "16:00:00",
        estado: "confirmada",
        ...fechas,
      }], {});
      console.log("[EXITO] Cita Bienestar inyectada.");
    } catch (e) { console.log("[ERROR] citas_bienestar:", e.message); }

    // 6. RESERVAS HABITACION -> faltaban fecha_entrada, fecha_salida,
    //    numero_huespedes, total (todas NOT NULL)
    try {
      await queryInterface.bulkInsert("reservas_habitacion", [{
        usuario_id: 1,
        habitacion_id: 1,
        fecha_entrada: "2026-11-01",
        fecha_salida: "2026-11-03",
        numero_huespedes: 2,
        estado: "pendiente",
        total: 2000.00,
        ...fechas,
      }], {});
      console.log("[EXITO] Reserva Habitacion inyectada.");
    } catch (e) { console.log("[ERROR] reservas_habitacion:", e.message); }

    // 7. RESERVAS PARQUEO -> esta tabla NO tiene "usuario_id" ni "estado".
    //    Se liga a una reserva_habitacion (no directo al usuario) y
    //    fecha_entrada/fecha_salida son tipo DATE, no un campo "estado".
    try {
      await queryInterface.bulkInsert("reservas_parqueo", [{
        reserva_habitacion_id: 1,
        parqueo_id: 1,
        fecha_entrada: new Date("2026-11-01T14:00:00"),
        fecha_salida: new Date("2026-11-03T12:00:00"),
        ...fechas,
      }], {});
      console.log("[EXITO] Reserva Parqueo inyectada.");
    } catch (e) { console.log("[ERROR] reservas_parqueo:", e.message); }

    // 8. FACTURAS -> faltaban nit, nombre_fiscal, subtotal, iva, total (NOT NULL)
    try {
      await queryInterface.bulkInsert("facturas", [{
        usuario_id: 1,
        nit: "CF",
        nombre_fiscal: "Consumidor Final",
        direccion_fiscal: "Ciudad de Guatemala",
        subtotal: 714.29,
        iva: 85.71,
        total: 800.00,
        estado: "emitida",
        fecha_emision: new Date(),
        ...fechas,
      }], {});
      console.log("[EXITO] Factura inyectada.");
    } catch (e) { console.log("[ERROR] facturas:", e.message); }

    // 9. RESERVAS EVENTO -> la tabla se llama "reservas_evento" (singular),
    //    no "reservas_eventos". Faltaban varias columnas NOT NULL.
    try {
      await queryInterface.bulkInsert("reservas_evento", [{
        usuario_id: 1,
        salon_id: 1,
        tipo_evento: "Boda",
        fecha: "2026-12-05",
        hora_inicio: "18:00:00",
        hora_fin: "23:00:00",
        numero_invitados: 80,
        estado: "cotizacion",
        anticipo: 1000.00,
        total: 6000.00,
        ...fechas,
      }], {});
      console.log("[EXITO] Reserva Evento inyectada.");
    } catch (e) { console.log("[ERROR] reservas_evento:", e.message); }

    // 10. CARRITOS -> esta tabla NO tiene columna "total".
    //     El total se calcula sumando "carrito_items" (que sí existe y
    //     ya tiene un diseño polimórfico: tipo_item + referencia_id).
    try {
      await queryInterface.bulkInsert("carritos", [{
        usuario_id: 1,
        estado: "activo",
        expira_en: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ...fechas,
      }], {});
      await queryInterface.bulkInsert("carrito_items", [{
        carrito_id: 1,
        tipo_item: "reserva_mesa",
        referencia_id: 1,
        descripcion: "Reserva de mesa - Terraza",
        precio: 0.00,
        cantidad: 1,
        ...fechas,
      }], {});
      console.log("[EXITO] Carrito e item inyectados.");
    } catch (e) { console.log("[ERROR] carritos/carrito_items:", e.message); }

    // 11. RESERVAS TRANSPORTE -> faltaban origen, destino, fecha_hora,
    //     numero_pasajeros (NOT NULL)
    try {
      await queryInterface.bulkInsert("reservas_transporte", [{
        usuario_id: 1,
        chofer_id: 1,
        vehiculo_id: 1,
        origen: "Hotel Central",
        destino: "Aeropuerto La Aurora",
        fecha_hora: new Date("2026-10-20T08:00:00"),
        numero_pasajeros: 3,
        estado: "pendiente",
        ...fechas,
      }], {});
      console.log("[EXITO] Reserva Transporte inyectada.");
    } catch (e) { console.log("[ERROR] reservas_transporte:", e.message); }
  },

  down: async (queryInterface) => {
    const tablas = [
      "reservas_parqueo", "carrito_items", "boletos_parque", "reservas_mesa",
      "reservas_actividad", "reservas_amenidad", "citas_bienestar",
      "reservas_habitacion", "facturas", "reservas_evento", "carritos",
      "reservas_transporte",
      "habitaciones", "parqueos", "salones", "mesas", "recursos_actividad", "amenidades",
      "usuarios", "sucursales", "tipos_habitacion", "servicios_evento",
      "instructores", "terapeutas", "servicios_bienestar", "choferes",
      "vehiculos", "promociones", "proveedores",
    ];
    for (const tabla of tablas) {
      try { await queryInterface.bulkDelete(tabla, null, {}); } catch (e) {}
    }
  },
};