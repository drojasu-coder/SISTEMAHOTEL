"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FacturaItem extends Model {
    static associate(models) {
      FacturaItem.belongsTo(models.Factura, { foreignKey: "factura_id" });
    }
  }
  FacturaItem.init(
    {
      factura_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "FacturaItem",
      tableName: "factura_items",
      timestamps: true,
    },
  );
  return FacturaItem;
};
