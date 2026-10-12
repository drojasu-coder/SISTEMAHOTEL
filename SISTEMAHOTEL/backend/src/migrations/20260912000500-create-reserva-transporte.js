"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservas_transporte", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      chofer_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "choferes",
          key: "id",
        },
      },
      vehiculo_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "vehiculos",
          key: "id",
        },
      },
      origen: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      destino: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      fecha_hora: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      numero_pasajeros: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
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
    await queryInterface.dropTable("reservas_transporte");
  },
};
