"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaEventoServicio extends Model {
    static associate(models) {
      ReservaEventoServicio.belongsTo(models.ReservaEvento, { foreignKey: "reserva_evento_id" });
      ReservaEventoServicio.belongsTo(models.ServicioEvento, { foreignKey: "servicio_evento_id" });
    }
  }
  ReservaEventoServicio.init(
    {
      reserva_evento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      servicio_evento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ReservaEventoServicio",
      tableName: "reserva_evento_servicios",
      timestamps: true,
    },
  );
  return ReservaEventoServicio;
};
