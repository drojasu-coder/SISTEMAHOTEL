"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservas_parqueo", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reserva_habitacion_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "reservas_habitacion",
          key: "id",
        },
      },
      parqueo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "parqueos",
          key: "id",
        },
      },
      fecha_entrada: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      fecha_salida: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable("reservas_parqueo");
  },
};
