"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("facturas", "porcentaje_iva", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 12,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("facturas", "porcentaje_iva");
  },
};
