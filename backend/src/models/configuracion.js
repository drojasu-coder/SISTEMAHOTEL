"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Configuracion extends Model {}

  Configuracion.init(
    {
      porcentaje_iva: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 12,
      },
    },
    {
      sequelize,
      modelName: "Configuracion",
      tableName: "configuraciones",
      timestamps: true,
    }
  );

  return Configuracion;
};
