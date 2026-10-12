"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("salones", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sucursal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "sucursales",
          key: "id",
        },
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      capacidad_maxima: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tarifa_base: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("salones");
  },
};
