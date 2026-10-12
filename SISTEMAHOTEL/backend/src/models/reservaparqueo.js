"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaParqueo extends Model {
    static associate(models) {
      ReservaParqueo.belongsTo(models.ReservaHabitacion, { foreignKey: "reserva_habitacion_id" });
      ReservaParqueo.belongsTo(models.Parqueo, { foreignKey: "parqueo_id" });
    }
  }
  ReservaParqueo.init(
    {
      reserva_habitacion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      parqueo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha_entrada: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      fecha_salida: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ReservaParqueo",
      tableName: "reservas_parqueo",
      timestamps: true,
    },
  );
  return ReservaParqueo;
};
