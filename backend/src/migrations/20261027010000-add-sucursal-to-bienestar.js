"use strict";

/**
 * Vincula servicios y terapeutas de bienestar con una sucursal.
 *
 * Migración aditiva: sucursal_id admite NULL para conservar los registros
 * anteriores (servicios generales) y sus citas históricas. "activo" permite
 * retirar un servicio del catálogo público sin borrarlo.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sucursalFk = {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: { model: "sucursales", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      };

      await queryInterface.addColumn("servicios_bienestar", "sucursal_id", sucursalFk, { transaction });
      await queryInterface.addColumn(
        "servicios_bienestar",
        "activo",
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        { transaction }
      );
      await queryInterface.addColumn("terapeutas", "sucursal_id", sucursalFk, { transaction });

      await queryInterface.addIndex("servicios_bienestar", ["sucursal_id"], {
        name: "servicios_bienestar_sucursal_id_idx",
        transaction,
      });
      await queryInterface.addIndex("terapeutas", ["sucursal_id"], {
        name: "terapeutas_sucursal_id_idx",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("terapeutas", "terapeutas_sucursal_id_idx", { transaction });
      await queryInterface.removeIndex("servicios_bienestar", "servicios_bienestar_sucursal_id_idx", { transaction });
      await queryInterface.removeColumn("terapeutas", "sucursal_id", { transaction });
      await queryInterface.removeColumn("servicios_bienestar", "activo", { transaction });
      await queryInterface.removeColumn("servicios_bienestar", "sucursal_id", { transaction });
    });
  },
};
