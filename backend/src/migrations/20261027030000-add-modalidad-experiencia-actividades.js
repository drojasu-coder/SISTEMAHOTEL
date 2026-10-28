"use strict";

/**
 * Modalidad "experiencia" para recursos de actividad.
 *
 * - por_hora (valor por defecto, comportamiento anterior): reserva exclusiva
 *   del recurso entre 30 min y 2 h, total = precio_hora × horas.
 * - experiencia: salida de duración fija con cupo compartido,
 *   total = precio_persona × numero_participantes.
 *
 * Migración aditiva: los recursos y reservas existentes quedan en por_hora
 * con numero_participantes = 1, por lo que sus totales no cambian.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "recursos_actividad",
        "modalidad",
        { type: Sequelize.STRING(20), allowNull: false, defaultValue: "por_hora" },
        { transaction }
      );
      await queryInterface.addColumn(
        "recursos_actividad",
        "duracion_minutos",
        { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
        { transaction }
      );
      await queryInterface.addColumn(
        "recursos_actividad",
        "cupo_maximo",
        { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
        { transaction }
      );
      await queryInterface.addColumn(
        "recursos_actividad",
        "precio_persona",
        { type: Sequelize.DECIMAL(10, 2), allowNull: true, defaultValue: null },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "recursos_actividad"
           ADD CONSTRAINT "recursos_actividad_modalidad_valid_check"
             CHECK (modalidad IN ('por_hora', 'experiencia')),
           ADD CONSTRAINT "recursos_actividad_experiencia_completa_check"
             CHECK (
               modalidad = 'por_hora'
               OR (
                 duracion_minutos IS NOT NULL AND duracion_minutos BETWEEN 30 AND 720
                 AND cupo_maximo IS NOT NULL AND cupo_maximo > 0
                 AND precio_persona IS NOT NULL AND precio_persona >= 0
               )
             )`,
        { transaction }
      );

      await queryInterface.addColumn(
        "reservas_actividad",
        "numero_participantes",
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "reservas_actividad"
           ADD CONSTRAINT "reservas_actividad_participantes_positive_check"
             CHECK (numero_participantes >= 1)`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint("reservas_actividad", "reservas_actividad_participantes_positive_check", { transaction });
      await queryInterface.removeColumn("reservas_actividad", "numero_participantes", { transaction });
      await queryInterface.removeConstraint("recursos_actividad", "recursos_actividad_experiencia_completa_check", { transaction });
      await queryInterface.removeConstraint("recursos_actividad", "recursos_actividad_modalidad_valid_check", { transaction });
      for (const column of ["precio_persona", "cupo_maximo", "duracion_minutos", "modalidad"]) {
        await queryInterface.removeColumn("recursos_actividad", column, { transaction });
      }
    });
  },
};
