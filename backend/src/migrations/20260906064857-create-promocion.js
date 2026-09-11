'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promociones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING
      },
      tipo_descuento: {
        type: Sequelize.STRING
      },
      valor_descuento: {
        type: Sequelize.DECIMAL
      },
      aplica_a: {
        type: Sequelize.STRING
      },
      fecha_inicio: {
        type: Sequelize.DATEONLY
      },
      fecha_fin: {
        type: Sequelize.DATEONLY
      },
      activa: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('promociones');
  }
};