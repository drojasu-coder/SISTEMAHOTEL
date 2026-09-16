"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("configuraciones", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      porcentaje_iva: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 12,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.bulkInsert("configuraciones", [
      { porcentaje_iva: 12, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("configuraciones");
  },
};
