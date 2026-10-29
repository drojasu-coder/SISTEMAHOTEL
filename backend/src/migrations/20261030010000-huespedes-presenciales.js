"use strict";

/**
 * Reservas presenciales de Recepción.
 *
 * 1. Tabla `huespedes`: persona atendida en recepción sin cuenta en la plataforma.
 *    No es un usuario: no tiene correo obligatorio, contraseña ni acceso.
 * 2. `reservas_habitacion.huesped_id` (nullable) y `usuario_id` pasa a nullable.
 *    La restricción `reservas_habitacion_titular_check` exige EXACTAMENTE uno de los
 *    dos titulares: cuenta de cliente o huésped sin cuenta. Las filas existentes ya
 *    tienen usuario_id y huesped_id NULL, así que la cumplen sin modificarse.
 * 3. `reservas_habitacion.registrado_por_usuario_id` y `pagos.registrado_por_usuario_id`
 *    (nullable): empleado que registró la reserva o el cobro en efectivo (auditoría).
 *
 * Aditiva: no modifica ni borra datos existentes.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "huespedes",
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          nombre_completo: { type: Sequelize.STRING(150), allowNull: false },
          telefono: { type: Sequelize.STRING(30), allowNull: true },
          email: { type: Sequelize.STRING(150), allowNull: true },
          sucursal_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "sucursales", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          registrado_por_usuario_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "usuarios", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE },
        },
        { transaction }
      );
      await queryInterface.addIndex("huespedes", ["sucursal_id"], { name: "huespedes_sucursal_idx", transaction });

      await queryInterface.addColumn(
        "reservas_habitacion",
        "huesped_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "huespedes", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );
      await queryInterface.addIndex("reservas_habitacion", ["huesped_id"], { name: "reservas_habitacion_huesped_idx", transaction });
      await queryInterface.addColumn(
        "reservas_habitacion",
        "registrado_por_usuario_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "usuarios", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );
      // Solo se retira NOT NULL; la clave foránea hacia usuarios se conserva intacta.
      await queryInterface.sequelize.query(
        `ALTER TABLE reservas_habitacion ALTER COLUMN usuario_id DROP NOT NULL`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE reservas_habitacion ADD CONSTRAINT reservas_habitacion_titular_check
           CHECK ((usuario_id IS NULL) <> (huesped_id IS NULL))`,
        { transaction }
      );

      await queryInterface.addColumn(
        "pagos",
        "registrado_por_usuario_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "usuarios", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // No se revierte si ya existen reservas de huéspedes sin cuenta: se perdería su titular.
      const [rows] = await queryInterface.sequelize.query(
        `SELECT count(*)::int AS n FROM reservas_habitacion WHERE huesped_id IS NOT NULL`,
        { transaction }
      );
      if (rows[0].n > 0) {
        throw new Error(`Existen ${rows[0].n} reservas de huéspedes sin cuenta; no se puede revertir sin perder su titular`);
      }
      await queryInterface.removeColumn("pagos", "registrado_por_usuario_id", { transaction });
      await queryInterface.sequelize.query(
        `ALTER TABLE reservas_habitacion DROP CONSTRAINT IF EXISTS reservas_habitacion_titular_check`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE reservas_habitacion ALTER COLUMN usuario_id SET NOT NULL`,
        { transaction }
      );
      await queryInterface.removeColumn("reservas_habitacion", "registrado_por_usuario_id", { transaction });
      await queryInterface.removeColumn("reservas_habitacion", "huesped_id", { transaction });
      await queryInterface.dropTable("huespedes", { transaction });
    });
  },
};
