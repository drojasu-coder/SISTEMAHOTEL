"use strict";

/**
 * Migración ADITIVA. NO se ejecuta automáticamente.
 *
 * Añade el vencimiento de pago de las reservas de habitación pendientes:
 * - Columna nullable: ninguna fila existente se modifica (las reservas históricas
 *   conservan expira_en = NULL y nunca son elegibles para expiración automática).
 * - Índice parcial solo sobre las pendientes con vencimiento, para que la tarea
 *   periódica no recorra la tabla completa.
 * Es reversible y no requiere reescritura de datos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.addColumn(
        "reservas_habitacion",
        "expira_en",
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX reservas_habitacion_pendientes_expiracion_idx
           ON reservas_habitacion (expira_en)
           WHERE estado = 'pendiente' AND expira_en IS NOT NULL`,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.sequelize.query("DROP INDEX IF EXISTS reservas_habitacion_pendientes_expiracion_idx", { transaction });
      await queryInterface.removeColumn("reservas_habitacion", "expira_en", { transaction });
    });
  },
};
