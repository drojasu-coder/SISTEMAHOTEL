"use strict";

/**
 * Sedes adicionales autorizadas para un empleado.
 *
 * La sede principal sigue siendo empleados.sucursal_id. Esta tabla solo amplía el
 * alcance cuando una persona trabaja en varias sedes. Aditiva y vacía: no asigna
 * sedes a nadie ni concede acceso global.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "empleado_sedes",
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          empleado_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "empleados", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          sucursal_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "sucursales", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE },
        },
        { transaction }
      );
      await queryInterface.addIndex("empleado_sedes", ["empleado_id", "sucursal_id"], {
        name: "empleado_sedes_empleado_sucursal_unique",
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("empleado_sedes");
  },
};
