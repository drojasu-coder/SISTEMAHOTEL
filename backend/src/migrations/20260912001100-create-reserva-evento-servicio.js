"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reserva_evento_servicios", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reserva_evento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "reservas_evento",
          key: "id",
        },
      },
      servicio_evento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "servicios_evento",
          key: "id",
        },
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
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
    await queryInterface.dropTable("reserva_evento_servicios");
  },
};
