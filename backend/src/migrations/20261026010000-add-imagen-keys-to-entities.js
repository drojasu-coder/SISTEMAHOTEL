"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Agregar imagen_key a amenidades
    await queryInterface.addColumn("amenidades", "imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    // 2. Agregar imagen_key a tipos_habitacion
    await queryInterface.addColumn("tipos_habitacion", "imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    // 3. Agregar restaurante_imagen_key a sucursales
    await queryInterface.addColumn("sucursales", "restaurante_imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    // 4. Agregar imagen_key a habitaciones
    await queryInterface.addColumn("habitaciones", "imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("habitaciones", "imagen_key");
    await queryInterface.removeColumn("sucursales", "restaurante_imagen_key");
    await queryInterface.removeColumn("tipos_habitacion", "imagen_key");
    await queryInterface.removeColumn("amenidades", "imagen_key");
  },
};
