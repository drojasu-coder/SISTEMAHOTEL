"use strict";

/**
 * Distingue amenidades reservables (con control de aforo) de espacios
 * compartidos de libre acceso. Aditiva: todas las existentes quedan
 * reservables, como hasta ahora.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("amenidades", "reservable", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("amenidades", "reservable");
  },
};
