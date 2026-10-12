"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("turnos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      empleado_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "empleados",
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
    await queryInterface.dropTable("turnos");
  },
};
