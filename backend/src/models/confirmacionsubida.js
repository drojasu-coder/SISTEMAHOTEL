"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ConfirmacionSubida extends Model {
    static associate(models) {
      ConfirmacionSubida.belongsTo(models.Sucursal, { foreignKey: "sede_id" });
    }
  }

  ConfirmacionSubida.init(
    {
      token_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      sede_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      temp_key: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      final_key: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ConfirmacionSubida",
      tableName: "confirmaciones_subida",
      timestamps: true,
    },
  );

  return ConfirmacionSubida;
};
