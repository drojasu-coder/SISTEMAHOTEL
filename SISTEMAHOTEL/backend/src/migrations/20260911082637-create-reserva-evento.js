"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservas_evento", {
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

      salon_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "salones",
          key: "id",
        },
      },

      tipo_evento: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      numero_invitados: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "cotizacion",
      },
      anticipo: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      total: {
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("reservas_evento");
  },
};
