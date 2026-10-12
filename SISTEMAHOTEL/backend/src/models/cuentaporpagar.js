"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CuentaPorPagar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CuentaPorPagar.belongsTo(models.Proveedor, { foreignKey: "proveedor_id" });
    }
  }
  CuentaPorPagar.init(
    {
      proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fecha_vencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      factura_referencia: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CuentaPorPagar",
      tableName: "cuentas_por_pagar",
      timestamps: true,
    },
  );
  return CuentaPorPagar;
};
