"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("carrito_items", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      carrito_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "carritos",
          key: "id",
        },
      },
      tipo_item: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      referencia_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.STRING(255),
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      promocion_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "promociones",
          key: "id",
        },
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
    await queryInterface.dropTable("carrito_items");
  },
};
