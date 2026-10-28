"use strict";

/** Fotografía ilustrativa de cada producto del menú (clave S3/CloudFront). Aditiva. */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("productos_menu", "imagen_key", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("productos_menu", "imagen_key");
  },
};
