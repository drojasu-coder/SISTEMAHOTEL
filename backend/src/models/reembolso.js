"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Reembolso extends Model {
    static associate(models) {
      Reembolso.belongsTo(models.Pago, { foreignKey: "pago_id" });
    }
  }

  Reembolso.init(
    {
      pago_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      moneda: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "GTQ",
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      id_reembolso_externo: {
        type: DataTypes.STRING(150),
        allowNull: true,
        unique: true,
      },
      motivo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fecha_reembolso: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Reembolso",
      tableName: "reembolsos",
      timestamps: true,
    },
  );

  return Reembolso;
};
