"use strict";

/**
 * Migración ADITIVA. NO se ejecuta automáticamente.
 *
 * Horario de operación configurable por servicio o recurso, con el que el
 * backend calcula las franjas reservables (inicios cada 30 minutos, hora de
 * Guatemala):
 * - servicios_bienestar, amenidades y recursos_actividad: hora_apertura y
 *   hora_cierre. Sin ambos valores el servicio no ofrece franjas.
 * - amenidades: duracion_minutos, la duración fija de cada reserva.
 *
 * Columnas nullable: ninguna fila existente se modifica; el horario lo define
 * el administrador desde el panel. Es reversible y no reescribe datos.
 */
const TABLAS_CON_HORARIO = ["servicios_bienestar", "amenidades", "recursos_actividad"];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      for (const tabla of TABLAS_CON_HORARIO) {
        await queryInterface.addColumn(tabla, "hora_apertura", { type: Sequelize.TIME, allowNull: true }, { transaction });
        await queryInterface.addColumn(tabla, "hora_cierre", { type: Sequelize.TIME, allowNull: true }, { transaction });
        await queryInterface.sequelize.query(
          `ALTER TABLE ${tabla} ADD CONSTRAINT ${tabla}_horario_operacion_chk
             CHECK (hora_apertura IS NULL OR hora_cierre IS NULL OR hora_apertura < hora_cierre)`,
          { transaction },
        );
      }
      await queryInterface.addColumn("amenidades", "duracion_minutos", { type: Sequelize.INTEGER, allowNull: true }, { transaction });
      await queryInterface.sequelize.query(
        `ALTER TABLE amenidades ADD CONSTRAINT amenidades_duracion_minutos_chk
           CHECK (duracion_minutos IS NULL OR duracion_minutos > 0)`,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.sequelize.query("ALTER TABLE amenidades DROP CONSTRAINT IF EXISTS amenidades_duracion_minutos_chk", { transaction });
      await queryInterface.removeColumn("amenidades", "duracion_minutos", { transaction });
      for (const tabla of TABLAS_CON_HORARIO) {
        await queryInterface.sequelize.query(`ALTER TABLE ${tabla} DROP CONSTRAINT IF EXISTS ${tabla}_horario_operacion_chk`, { transaction });
        await queryInterface.removeColumn(tabla, "hora_cierre", { transaction });
        await queryInterface.removeColumn(tabla, "hora_apertura", { transaction });
      }
    });
  },
};
