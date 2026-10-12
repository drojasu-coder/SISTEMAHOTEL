"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("pagos", "carrito_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "carritos",
        key: "id",
      },
    });
    await queryInterface.changeColumn("pagos", "reserva_habitacion_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("pagos", "carrito_id");
    await queryInterface.changeColumn("pagos", "reserva_habitacion_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
