"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservas_amenidad", {
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
      amenidad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "amenidades",
          key: "id",
        },
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      franja_horaria: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      mobiliario: {
        type: Sequelize.STRING(30),
      },
      codigo_qr: {
        type: Sequelize.STRING(150),
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "confirmada",
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
    await queryInterface.dropTable("reservas_amenidad");
  },
};
