"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pago extends Model {
    static associate(models) {
      Pago.belongsTo(models.ReservaHabitacion, { foreignKey: "reserva_habitacion_id" });
      Pago.belongsTo(models.Carrito, { foreignKey: "carrito_id" });
      Pago.hasMany(models.Reembolso, { foreignKey: "pago_id" });
    }
  }
  Pago.init(
    {
      reserva_habitacion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      carrito_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      moneda: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "GTQ",
      },
      tipo_pago: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "total",
      },
      pasarela: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      idempotency_key: {
        type: DataTypes.STRING(150),
        allowNull: true,
        unique: true,
      },
      fecha_pago: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      codigo_error_externo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      mensaje_error: {
        type: DataTypes.STRING(255),
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
