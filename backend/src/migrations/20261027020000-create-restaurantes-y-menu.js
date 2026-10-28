"use strict";

/**
 * Restaurante principal por sucursal y su menú.
 *
 * Migración aditiva: crea restaurantes y productos_menu, y añade
 * mesas.restaurante_id (NULL permitido para no invalidar mesas ni
 * reservas de mesa existentes).
 */

const CATEGORIAS = ["desayuno", "entrada", "plato_fuerte", "postre", "bebida"];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "restaurantes",
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          sucursal_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: "sucursales", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          nombre: { type: Sequelize.STRING(120), allowNull: false },
          descripcion: { type: Sequelize.TEXT, allowNull: true },
          activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE },
        },
        { transaction }
      );

      await queryInterface.createTable(
        "productos_menu",
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          restaurante_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "restaurantes", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          categoria: { type: Sequelize.STRING(20), allowNull: false },
          nombre: { type: Sequelize.STRING(120), allowNull: false },
          descripcion: { type: Sequelize.TEXT, allowNull: true },
          precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          disponible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE },
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE "productos_menu"
           ADD CONSTRAINT "productos_menu_categoria_valid_check"
             CHECK (categoria IN (${CATEGORIAS.map((c) => `'${c}'`).join(", ")})),
           ADD CONSTRAINT "productos_menu_precio_positive_check" CHECK (precio > 0)`,
        { transaction }
      );
      await queryInterface.addIndex("productos_menu", ["restaurante_id", "nombre"], {
        name: "productos_menu_restaurante_nombre_unique",
        unique: true,
        transaction,
      });

      await queryInterface.addColumn(
        "mesas",
        "restaurante_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          references: { model: "restaurantes", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );
      await queryInterface.addIndex("mesas", ["restaurante_id"], { name: "mesas_restaurante_id_idx", transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("mesas", "mesas_restaurante_id_idx", { transaction });
      await queryInterface.removeColumn("mesas", "restaurante_id", { transaction });
      await queryInterface.dropTable("productos_menu", { transaction });
      await queryInterface.dropTable("restaurantes", { transaction });
    });
  },
};
