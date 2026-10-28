"use strict";

// Aditiva: los documentos existentes conservan sus precios base y sus importes.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn("facturas", "precios_incluyen_impuestos", { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, { transaction });
      await queryInterface.addColumn("facturas", "inguat", { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, { transaction });
      await queryInterface.addColumn("facturas", "porcentaje_inguat", { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }, { transaction });
      await queryInterface.addColumn("factura_items", "tipo_concepto", { type: Sequelize.STRING(20), allowNull: false, defaultValue: "servicio" }, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("factura_items", "tipo_concepto", { transaction });
      await queryInterface.removeColumn("facturas", "porcentaje_inguat", { transaction });
      await queryInterface.removeColumn("facturas", "inguat", { transaction });
      await queryInterface.removeColumn("facturas", "precios_incluyen_impuestos", { transaction });
    });
  },
};
