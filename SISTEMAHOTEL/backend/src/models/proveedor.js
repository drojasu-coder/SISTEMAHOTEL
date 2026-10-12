"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Proveedor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Proveedor.hasMany(models.ProveedorProducto, { foreignKey: "proveedor_id" });
      Proveedor.hasMany(models.CuentaPorPagar, { foreignKey: "proveedor_id" });
    }
  }
  Proveedor.init(
    {
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      nit: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      contacto: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Proveedor",
      tableName: "proveedores",
      timestamps: true,
    },
  );
  return Proveedor;
};
