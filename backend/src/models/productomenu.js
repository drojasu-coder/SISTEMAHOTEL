"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProductoMenu extends Model {
    static associate(models) {
      ProductoMenu.belongsTo(models.Restaurante, { foreignKey: "restaurante_id" });
    }
  }
  ProductoMenu.init(
    {
      restaurante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      categoria: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      disponible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      imagen_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "ProductoMenu",
      tableName: "productos_menu",
      timestamps: true,
    },
  );
  return ProductoMenu;
};
