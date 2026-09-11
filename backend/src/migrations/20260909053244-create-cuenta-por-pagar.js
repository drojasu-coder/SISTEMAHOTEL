'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cuentas_por_pagar', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      proveedor_id: {
        type: Sequelize.INTEGER,
        allowNull:false,
        references: {
          model: 'proveedores',
          key: 'id'
        }
      },
      monto: {
        type: Sequelize.DECIMAL
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY
      },
      estado: {
        type: Sequelize.STRING
      },
      factura_referencia: {
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cuentas_por_pagar');
  }
};