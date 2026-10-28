"use strict";

/**
 * Las tarifas son por tipo y el modelo de precios es global, así que cada sede
 * tiene sus propios tipos ("Deluxe King · Antigua"). Esta migración aditiva
 * guarda de forma explícita la sede y el nombre comercial visible ("Deluxe King"),
 * para no depender del sufijo del nombre interno.
 *
 * NULL en ambas columnas = tipo anterior (general), que se conserva por su historial.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "tipos_habitacion",
        "sucursal_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          references: { model: "sucursales", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "tipos_habitacion",
        "nombre_comercial",
        { type: Sequelize.STRING(50), allowNull: true, defaultValue: null },
        { transaction }
      );
      await queryInterface.addIndex("tipos_habitacion", ["sucursal_id"], {
        name: "tipos_habitacion_sucursal_id_idx",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("tipos_habitacion", "tipos_habitacion_sucursal_id_idx", { transaction });
      await queryInterface.removeColumn("tipos_habitacion", "nombre_comercial", { transaction });
      await queryInterface.removeColumn("tipos_habitacion", "sucursal_id", { transaction });
    });
  },
};
