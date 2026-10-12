'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('sucursales', [
      {
        nombre: 'Sucursal Antigua',
        direccion: '5ta Avenida Norte',
        ciudad: 'Antigua Guatemala',
        telefono: '78320001',
        activa: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Sucursal Zona 10',
        direccion: '12 Calle 1-25',
        ciudad: 'Guatemala',
        telefono: '23600002',
        activa: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sucursales', null, {});
  }
};