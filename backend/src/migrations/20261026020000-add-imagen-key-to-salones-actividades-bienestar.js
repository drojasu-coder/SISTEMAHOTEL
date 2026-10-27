"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Agregar imagen_key a salones
    await queryInterface.addColumn("salones", "imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    // 2. Agregar imagen_key a recursos_actividad
    await queryInterface.addColumn("recursos_actividad", "imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    // 3. Agregar imagen_key a servicios_bienestar
    await queryInterface.addColumn("servicios_bienestar", "imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    // 4. Hacer nullable sede_id en confirmaciones_subida para entidades globales
    await queryInterface.changeColumn("confirmaciones_subida", "sede_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("confirmaciones_subida", "sede_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.removeColumn("servicios_bienestar", "imagen_key");
    await queryInterface.removeColumn("recursos_actividad", "imagen_key");
    await queryInterface.removeColumn("salones", "imagen_key");
  },
};
