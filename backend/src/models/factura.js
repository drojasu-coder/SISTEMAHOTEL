"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Factura extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Factura.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      Factura.hasMany(models.FacturaItem, { foreignKey: "factura_id" });
    }
  }
  Factura.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nit: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      nombre_fiscal: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      direccion_fiscal: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      iva: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      fecha_emision: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Factura",
      tableName: "facturas",
      timestamps: true,
    },
  );
  return Factura;
};
