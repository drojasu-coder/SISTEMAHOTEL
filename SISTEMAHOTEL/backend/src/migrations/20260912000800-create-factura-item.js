"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("factura_items", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      factura_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "facturas",
          key: "id",
        },
      },
      descripcion: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      precio_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("factura_items");
  },
};
