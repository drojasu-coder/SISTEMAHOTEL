"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cuentas_por_pagar", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      proveedor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "proveedores",
          key: "id",
        },
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      factura_referencia: {
        type: Sequelize.STRING(100),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cuentas_por_pagar");
  },
};
