"use strict";

const STRIPE_EMAIL = "dev.payment.stripe@hotel.test";
const STRIPE_BRANCH_NAME = "DEV Payment Stripe Branch";
const STRIPE_ROOM_TYPE_NAME = "DEV Payment Stripe Room";
const STRIPE_ROOM_NUMBER = "S-TEST-01";
const CREATED_AT = new Date("2030-01-01T12:00:00.000Z");
const PASSWORD_HASH =
  "$2b$12$mGNc1THtPDA9ACtYZhcl3uccnScHoHURvgnRRF.AB7qLg6JsuZhc2";

async function insertReturning(sequelize, sql, replacements, transaction) {
  const [rows] = await sequelize.query(sql, { replacements, transaction });
  return rows[0].id;
}

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const [existingUsers] = await sequelize.query(
        "SELECT id FROM usuarios WHERE email = :email",
        {
          replacements: { email: STRIPE_EMAIL },
          transaction,
        },
      );

      if (existingUsers.length) return;

      const userId = await insertReturning(
        sequelize,
        `INSERT INTO usuarios
          (nombre, email, password_hash, rol, telefono, activo, "createdAt", "updatedAt")
         VALUES
          ('Development Stripe Payment Customer', :email, :passwordHash, 'cliente', '55550004', true, :createdAt, :createdAt)
         RETURNING id`,
        {
          email: STRIPE_EMAIL,
          passwordHash: PASSWORD_HASH,
          createdAt: CREATED_AT,
        },
        transaction,
      );

      const branchId = await insertReturning(
        sequelize,
        `INSERT INTO sucursales
          (nombre, direccion, ciudad, telefono, activa, "createdAt", "updatedAt")
         VALUES
          (:name, 'Development Stripe address', 'Guatemala', '55550104', true, :createdAt, :createdAt)
         RETURNING id`,
        {
          name: STRIPE_BRANCH_NAME,
          createdAt: CREATED_AT,
        },
        transaction,
      );

      const roomTypeId = await insertReturning(
        sequelize,
        `INSERT INTO tipos_habitacion
          (nombre, capacidad_maxima, tarifa_noche, descripcion, "createdAt", "updatedAt")
         VALUES
          (:name, 2, 2000, 'Controlled Stripe test fixture', :createdAt, :createdAt)
         RETURNING id`,
        {
          name: STRIPE_ROOM_TYPE_NAME,
          createdAt: CREATED_AT,
        },
        transaction,
      );

      const roomId = await insertReturning(
        sequelize,
        `INSERT INTO habitaciones
          (sucursal_id, tipo_habitacion_id, numero, estado, "createdAt", "updatedAt")
         VALUES
          (:branchId, :roomTypeId, :roomNumber, 'disponible', :createdAt, :createdAt)
         RETURNING id`,
        {
          branchId,
          roomTypeId,
          roomNumber: STRIPE_ROOM_NUMBER,
          createdAt: CREATED_AT,
        },
        transaction,
      );

      const reservationId = await insertReturning(
        sequelize,
        `INSERT INTO reservas_habitacion
          (usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, estado, total, "createdAt", "updatedAt")
         VALUES
          (:userId, :roomId, '2030-06-10', '2030-06-11', 2, 'pendiente', 2000, :createdAt, :createdAt)
         RETURNING id`,
        {
          userId,
          roomId,
          createdAt: CREATED_AT,
        },
        transaction,
      );

      const cartId = await insertReturning(
        sequelize,
        `INSERT INTO carritos
          (usuario_id, estado, expira_en, "createdAt", "updatedAt")
         VALUES
          (:userId, 'activo', '2030-06-09T23:59:00.000Z', :createdAt, :createdAt)
         RETURNING id`,
        {
          userId,
          createdAt: CREATED_AT,
        },
        transaction,
      );

      await sequelize.query(
        `INSERT INTO carrito_items
          (carrito_id, tipo_item, referencia_id, descripcion, precio, cantidad, "createdAt", "updatedAt")
         VALUES
          (:cartId, 'habitacion', :reservationId, 'Development Stripe room reservation', 2000, 1, :createdAt, :createdAt)`,
        {
          replacements: {
            cartId,
            reservationId,
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
        "SELECT id FROM usuarios WHERE email = :email",
        {
          replacements: { email: STRIPE_EMAIL },
          transaction,
        },
      );

      if (!users.length) return;

      const userIds = users.map(({ id }) => id);
      const replacements = { userIds };

      await sequelize.query(
        `DELETE FROM pagos
         WHERE carrito_id IN (
           SELECT id FROM carritos WHERE usuario_id IN (:userIds)
         )
         OR reserva_habitacion_id IN (
           SELECT id FROM reservas_habitacion WHERE usuario_id IN (:userIds)
         )`,
        { replacements, transaction },
      );
      await sequelize.query(
        "DELETE FROM carrito_items WHERE carrito_id IN (SELECT id FROM carritos WHERE usuario_id IN (:userIds))",
        { replacements, transaction },
      );
      await sequelize.query(
        "DELETE FROM carritos WHERE usuario_id IN (:userIds)",
        { replacements, transaction },
      );
      await sequelize.query(
        "DELETE FROM reservas_habitacion WHERE usuario_id IN (:userIds)",
        { replacements, transaction },
      );
      await sequelize.query(
        "DELETE FROM habitaciones WHERE numero = :roomNumber",
        {
          replacements: { roomNumber: STRIPE_ROOM_NUMBER },
          transaction,
        },
      );
      await sequelize.query(
        "DELETE FROM tipos_habitacion WHERE nombre = :roomTypeName",
        {
          replacements: { roomTypeName: STRIPE_ROOM_TYPE_NAME },
          transaction,
        },
      );
      await sequelize.query(
        "DELETE FROM sucursales WHERE nombre = :branchName",
        {
          replacements: { branchName: STRIPE_BRANCH_NAME },
          transaction,
        },
      );
      await sequelize.query(
        "DELETE FROM usuarios WHERE id IN (:userIds)",
        { replacements, transaction },
      );
    });
  },
};
