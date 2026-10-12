"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("citas_bienestar", {
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
      servicio_bienestar_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "servicios_bienestar",
          key: "id",
        },
      },
      terapeuta_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "terapeutas",
          key: "id",
        },
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
    await queryInterface.dropTable("citas_bienestar");
  },
};
