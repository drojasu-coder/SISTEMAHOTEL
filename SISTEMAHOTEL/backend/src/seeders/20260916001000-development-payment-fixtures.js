"use strict";

const MARKER_EMAIL = "dev.payment.fixtures@hotel.test";
const HTTP_EMAIL = "dev.payment.http@hotel.test";
const ADMIN_EMAIL = "dev.payment.admin@hotel.test";
const BRANCH_NAME = "DEV Payment Test Branch";
const ROOM_TYPE_NAME = "DEV Payment Test Room";
const ROOM_NUMBER = "DEV-901";
const HTTP_BRANCH_NAME = "DEV Payment HTTP Branch";
const HTTP_ROOM_TYPE_NAME = "DEV Payment HTTP Room";
const HTTP_ROOM_NUMBER = "H-HTTP-01";
const SALON_NAME = "DEV Payment Test Salon";
const CREATED_AT = new Date("2030-01-01T12:00:00.000Z");
const HTTP_PASSWORD_HASH = "$2b$12$mGNc1THtPDA9ACtYZhcl3uccnScHoHURvgnRRF.AB7qLg6JsuZhc2";

async function insertReturning(sequelize, sql, replacements, transaction) {
  const [rows] = await sequelize.query(sql, { replacements, transaction });
  return rows[0].id;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const [existing] = await sequelize.query(
        "SELECT id FROM usuarios WHERE email = :email",
        { replacements: { email: MARKER_EMAIL }, transaction },
      );
      if (existing.length) return;

      const userId = await insertReturning(
        sequelize,
        `INSERT INTO usuarios
          (nombre, email, password_hash, rol, telefono, activo, "createdAt", "updatedAt")
         VALUES (:nombre, :email, :password_hash, 'cliente', :telefono, true, :createdAt, :createdAt)
         RETURNING id`,
        {
          nombre: "Development Payment Customer",
          email: MARKER_EMAIL,
          password_hash: "$2b$10$7EqJtq98hPqEX7fNZaFWoO", // deterministic, non-production password
          telefono: "55550001",
          createdAt: CREATED_AT,
          updatedAt: CREATED_AT,
        },
        transaction,
      );
      const adminId = await insertReturning(
        sequelize,
        `INSERT INTO usuarios
          (nombre, email, password_hash, rol, telefono, activo, "createdAt", "updatedAt")
         VALUES ('Development Payment Admin', :email, :password_hash, 'admin', '55550002', true, :createdAt, :createdAt)
         RETURNING id`,
        {
          email: ADMIN_EMAIL,
          password_hash: "$2b$10$6CAtBn2gEHnqyOxr7hsEe.bdtZnJmiZTM0IrUcA0AgTwPrhgRN4j2",
          createdAt: CREATED_AT,
          updatedAt: CREATED_AT,
        },
        transaction,
      );
      const branchId = await insertReturning(
        sequelize,
        `INSERT INTO sucursales
          (nombre, direccion, ciudad, telefono, activa, "createdAt", "updatedAt")
         VALUES (:nombre, 'Development address', 'Guatemala', '55550100', true, :createdAt, :createdAt)
         RETURNING id`,
        { nombre: BRANCH_NAME, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const roomTypeId = await insertReturning(
        sequelize,
        `INSERT INTO tipos_habitacion
          (nombre, capacidad_maxima, tarifa_noche, descripcion, "createdAt", "updatedAt")
         VALUES (:nombre, 2, 2000, 'Controlled payment fixture', :createdAt, :createdAt)
         RETURNING id`,
        { nombre: ROOM_TYPE_NAME, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const roomId = await insertReturning(
        sequelize,
        `INSERT INTO habitaciones
          (sucursal_id, tipo_habitacion_id, numero, estado, "createdAt", "updatedAt")
         VALUES (:branchId, :roomTypeId, :number, 'disponible', :createdAt, :createdAt)
         RETURNING id`,
        { branchId, roomTypeId, number: ROOM_NUMBER, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const salonId = await insertReturning(
        sequelize,
        `INSERT INTO salones
          (sucursal_id, nombre, capacidad_maxima, tarifa_base, descripcion, "createdAt", "updatedAt")
         VALUES (:branchId, :name, 100, 10000, 'Controlled payment fixture', :createdAt, :createdAt)
         RETURNING id`,
        { branchId, name: SALON_NAME, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const roomReservationId = await insertReturning(
        sequelize,
        `INSERT INTO reservas_habitacion
          (usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, estado, total, "createdAt", "updatedAt")
         VALUES (:userId, :roomId, '2030-02-10', '2030-02-11', 2, 'pendiente', 2000, :createdAt, :createdAt)
         RETURNING id`,
        { userId, roomId, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const eventReservationId = await insertReturning(
        sequelize,
        `INSERT INTO reservas_evento
          (usuario_id, salon_id, tipo_evento, fecha, hora_inicio, hora_fin, numero_invitados, estado, anticipo, total, "createdAt", "updatedAt")
         VALUES (:userId, :salonId, 'Development event', '2030-03-15', '10:00', '16:00', 50, 'confirmada', 5000, 10000, :createdAt, :createdAt)
         RETURNING id`,
        { userId, salonId, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const adminEventReservationId = await insertReturning(
        sequelize,
        `INSERT INTO reservas_evento
          (usuario_id, salon_id, tipo_evento, fecha, hora_inicio, hora_fin, numero_invitados, estado, anticipo, total, "createdAt", "updatedAt")
         VALUES (:adminId, :salonId, 'Development approved event', '2030-04-15', '10:00', '14:00', 20, 'confirmada', 2500, 5000, :createdAt, :createdAt)
         RETURNING id`,
        { adminId, salonId, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const roomCartId = await insertReturning(
        sequelize,
        `INSERT INTO carritos (usuario_id, estado, expira_en, "createdAt", "updatedAt")
         VALUES (:userId, 'activo', '2030-02-09T23:59:00.000Z', :createdAt, :createdAt)
         RETURNING id`,
        { userId, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const eventCartId = await insertReturning(
        sequelize,
        `INSERT INTO carritos (usuario_id, estado, expira_en, "createdAt", "updatedAt")
         VALUES (:userId, 'activo', '2030-03-14T23:59:00.000Z', :createdAt, :createdAt)
         RETURNING id`,
        { userId, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      const adminCartId = await insertReturning(
        sequelize,
        `INSERT INTO carritos (usuario_id, estado, expira_en, "createdAt", "updatedAt")
         VALUES (:adminId, 'pagado', '2030-03-14T23:59:00.000Z', :createdAt, :createdAt)
         RETURNING id`,
        { adminId, createdAt: CREATED_AT, updatedAt: CREATED_AT },
        transaction,
      );
      await sequelize.query(
        `INSERT INTO carrito_items
          (carrito_id, tipo_item, referencia_id, descripcion, precio, cantidad, "createdAt", "updatedAt")
         VALUES
          (:roomCartId, 'habitacion', :roomReservationId, 'Development room reservation', 2000, 1, :createdAt, :createdAt),
          (:eventCartId, 'evento', :eventReservationId, 'Development event reservation', 10000, 1, :createdAt, :createdAt),
          (:adminCartId, 'evento', :adminEventReservationId, 'Development approved event', 5000, 1, :createdAt, :createdAt)`,
        { replacements: { roomCartId, eventCartId, adminCartId, roomReservationId, eventReservationId, adminEventReservationId, createdAt: CREATED_AT }, transaction },
      );
      await sequelize.query(
        `INSERT INTO pagos
          (reserva_habitacion_id, carrito_id, monto, metodo, estado, id_transaccion_externo, moneda, tipo_pago, pasarela, idempotency_key, fecha_pago, "createdAt", "updatedAt")
         VALUES
          (NULL, :eventCartId, 5000, 'transferencia', 'pendiente', 'DEV-TRANSFER-001', 'GTQ', 'anticipo', 'manual', 'dev-payment-transfer-001', NULL, :createdAt, :createdAt),
          (NULL, :adminCartId, 5000, 'efectivo', 'aprobado', 'DEV-APPROVED-001', 'GTQ', 'total', NULL, 'dev-payment-approved-001', NULL, :createdAt, :createdAt)`,
        { replacements: { eventCartId, adminCartId, createdAt: CREATED_AT, updatedAt: CREATED_AT }, transaction },
      );
    });

    await sequelize.transaction(async (transaction) => {
      const [existing] = await sequelize.query(
        "SELECT id FROM usuarios WHERE email = :email",
        { replacements: { email: HTTP_EMAIL }, transaction },
      );
      if (existing.length) return;

      const httpUserId = await insertReturning(
        sequelize,
        `INSERT INTO usuarios
          (nombre, email, password_hash, rol, telefono, activo, "createdAt", "updatedAt")
         VALUES ('Development HTTP Payment Customer', :email, :password_hash, 'cliente', '55550003', true, :createdAt, :createdAt)
         RETURNING id`,
        { email: HTTP_EMAIL, password_hash: HTTP_PASSWORD_HASH, createdAt: CREATED_AT },
        transaction,
      );
      const httpBranchId = await insertReturning(
        sequelize,
        `INSERT INTO sucursales
          (nombre, direccion, ciudad, telefono, activa, "createdAt", "updatedAt")
         VALUES (:name, 'Development HTTP address', 'Guatemala', '55550103', true, :createdAt, :createdAt)
         RETURNING id`,
        { name: HTTP_BRANCH_NAME, createdAt: CREATED_AT },
        transaction,
      );
      const httpRoomTypeId = await insertReturning(
        sequelize,
        `INSERT INTO tipos_habitacion
          (nombre, capacidad_maxima, tarifa_noche, descripcion, "createdAt", "updatedAt")
         VALUES (:name, 2, 2000, 'Controlled HTTP payment fixture', :createdAt, :createdAt)
         RETURNING id`,
        { name: HTTP_ROOM_TYPE_NAME, createdAt: CREATED_AT },
        transaction,
      );
      const httpRoomId = await insertReturning(
        sequelize,
        `INSERT INTO habitaciones
          (sucursal_id, tipo_habitacion_id, numero, estado, "createdAt", "updatedAt")
         VALUES (:branchId, :roomTypeId, :number, 'disponible', :createdAt, :createdAt)
         RETURNING id`,
        {
          branchId: httpBranchId,
          roomTypeId: httpRoomTypeId,
          number: HTTP_ROOM_NUMBER,
          createdAt: CREATED_AT,
        },
        transaction,
      );
      const httpReservationId = await insertReturning(
        sequelize,
        `INSERT INTO reservas_habitacion
          (usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, estado, total, "createdAt", "updatedAt")
         VALUES (:userId, :roomId, '2030-05-10', '2030-05-11', 2, 'pendiente', 2000, :createdAt, :createdAt)
         RETURNING id`,
        { userId: httpUserId, roomId: httpRoomId, createdAt: CREATED_AT },
        transaction,
      );
      const httpCartId = await insertReturning(
        sequelize,
        `INSERT INTO carritos (usuario_id, estado, expira_en, "createdAt", "updatedAt")
         VALUES (:userId, 'activo', '2030-05-09T23:59:00.000Z', :createdAt, :createdAt)
         RETURNING id`,
        { userId: httpUserId, createdAt: CREATED_AT },
        transaction,
      );
      await sequelize.query(
        `INSERT INTO carrito_items
          (carrito_id, tipo_item, referencia_id, descripcion, precio, cantidad, "createdAt", "updatedAt")
         VALUES (:cartId, 'habitacion', :reservationId, 'Development HTTP room reservation', 2000, 1, :createdAt, :createdAt)`,
        {
          replacements: {
            cartId: httpCartId,
            reservationId: httpReservationId,
            createdAt: CREATED_AT,
          },
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const [users] = await sequelize.query(
        "SELECT id FROM usuarios WHERE email IN (:emails)",
        { replacements: { emails: [MARKER_EMAIL, HTTP_EMAIL, ADMIN_EMAIL] }, transaction },
      );
      if (!users.length) return;
      const userIds = users.map(({ id }) => id);
      const replacements = { userIds };
      await sequelize.query(
        `DELETE FROM pagos WHERE carrito_id IN (SELECT id FROM carritos WHERE usuario_id IN (:userIds))
          OR reserva_habitacion_id IN (SELECT id FROM reservas_habitacion WHERE usuario_id IN (:userIds))`,
        { replacements, transaction },
      );
      await sequelize.query(
        "DELETE FROM carrito_items WHERE carrito_id IN (SELECT id FROM carritos WHERE usuario_id IN (:userIds))",
        { replacements, transaction },
      );
      await sequelize.query("DELETE FROM carritos WHERE usuario_id IN (:userIds)", { replacements, transaction });
      await sequelize.query("DELETE FROM reservas_evento WHERE usuario_id IN (:userIds)", { replacements, transaction });
      await sequelize.query("DELETE FROM reservas_habitacion WHERE usuario_id IN (:userIds)", { replacements, transaction });
      await sequelize.query("DELETE FROM habitaciones WHERE numero = :roomNumber", { replacements: { roomNumber: ROOM_NUMBER }, transaction });
      await sequelize.query("DELETE FROM habitaciones WHERE numero = :roomNumber", { replacements: { roomNumber: HTTP_ROOM_NUMBER }, transaction });
      await sequelize.query("DELETE FROM salones WHERE nombre = :salonName", { replacements: { salonName: SALON_NAME }, transaction });
      await sequelize.query(
        "DELETE FROM tipos_habitacion WHERE nombre = :roomTypeName",
        { replacements: { roomTypeName: ROOM_TYPE_NAME }, transaction },
      );
      await sequelize.query(
        "DELETE FROM tipos_habitacion WHERE nombre = :roomTypeName",
        { replacements: { roomTypeName: HTTP_ROOM_TYPE_NAME }, transaction },
      );
      await sequelize.query("DELETE FROM sucursales WHERE nombre = :branchName", { replacements: { branchName: BRANCH_NAME }, transaction });
      await sequelize.query("DELETE FROM sucursales WHERE nombre = :branchName", { replacements: { branchName: HTTP_BRANCH_NAME }, transaction });
      await sequelize.query("DELETE FROM usuarios WHERE id IN (:userIds)", { replacements, transaction });
    });
  },
};
