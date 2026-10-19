"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "recursos_actividad",
      "precio_hora",
      {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      }
    );

    await queryInterface.addColumn(
      "recursos_actividad",
      "precio_equipo",
      {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      }
    );

    await queryInterface.addColumn(
      "recursos_actividad",
      "precio_instructor_hora",
      {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      }
    );

    await queryInterface.addColumn(
      "reservas_actividad",
      "total",
      {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      "reservas_actividad",
      "total"
    );

    await queryInterface.removeColumn(
      "recursos_actividad",
      "precio_instructor_hora"
    );

    await queryInterface.removeColumn(
      "recursos_actividad",
      "precio_equipo"
    );

    await queryInterface.removeColumn(
      "recursos_actividad",
      "precio_hora"
    );
  },
};
