"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CarritoItem extends Model {
    static associate(models) {
      CarritoItem.belongsTo(models.Carrito, { foreignKey: "carrito_id" });
      CarritoItem.belongsTo(models.Promocion, { foreignKey: "promocion_id" });
    }
  }
  CarritoItem.init(
    {
      carrito_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo_item: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      referencia_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      promocion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CarritoItem",
      tableName: "carrito_items",
      timestamps: true,
    },
  );
  return CarritoItem;
};
