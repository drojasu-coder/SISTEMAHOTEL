'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('habitaciones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sucursal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sucursales',
          key: 'id'
        }
      },
      tipo_habitacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tipos_habitacion',
          key: 'id'
        }
      },
      numero: {
        type: Sequelize.STRING
      },
      estado: {
        type: Sequelize.STRING
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

    await queryInterface.addIndex('habitaciones', ['sucursal_id', 'numero'], {
      unique: true,
      name: 'habitaciones_sucursal_numero_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('habitaciones');
  }
};