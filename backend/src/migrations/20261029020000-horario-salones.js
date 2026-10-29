"use strict";

/**
 * Migración ADITIVA. NO se ejecuta automáticamente.
 *
 * Horario de uso de cada salón (hora de Guatemala), con el que el backend
 * calcula los inicios y finalizaciones válidos de una solicitud de evento
 * (cada 30 minutos). Columnas nullable: ninguna fila existente se modifica y
 * el horario lo define el administrador desde el panel. Es reversible.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.addColumn("salones", "hora_apertura", { type: Sequelize.TIME, allowNull: true }, { transaction });
      await queryInterface.addColumn("salones", "hora_cierre", { type: Sequelize.TIME, allowNull: true }, { transaction });
      await queryInterface.sequelize.query(
        `ALTER TABLE salones ADD CONSTRAINT salones_horario_operacion_chk
           CHECK (hora_apertura IS NULL OR hora_cierre IS NULL OR hora_apertura < hora_cierre)`,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.sequelize.query("ALTER TABLE salones DROP CONSTRAINT IF EXISTS salones_horario_operacion_chk", { transaction });
      await queryInterface.removeColumn("salones", "hora_cierre", { transaction });
      await queryInterface.removeColumn("salones", "hora_apertura", { transaction });
    });
  },
};
