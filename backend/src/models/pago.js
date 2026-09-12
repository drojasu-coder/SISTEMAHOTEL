"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pago extends Model {
    static associate(models) {
      Pago.belongsTo(models.ReservaHabitacion, { foreignKey: "reserva_habitacion_id" });
    }
  }
  Pago.init(
    {
      reserva_habitacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      metodo: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      id_transaccion_externo: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Pago",
      tableName: "pagos",
      timestamps: true,
    },
  );
  return Pago;
};
