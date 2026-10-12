"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pagos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reserva_habitacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "reservas_habitacion",
          key: "id",
        },
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      metodo: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      id_transaccion_externo: {
        type: Sequelize.STRING(150),
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
    await queryInterface.dropTable("pagos");
  },
};
