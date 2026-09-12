"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaHabitacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ReservaHabitacion.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      ReservaHabitacion.belongsTo(models.Habitacion, { foreignKey: "habitacion_id" });
      ReservaHabitacion.hasMany(models.ReservaParqueo, { foreignKey: "reserva_habitacion_id" });
      ReservaHabitacion.hasMany(models.Pago, { foreignKey: "reserva_habitacion_id" });
    }
  }
  ReservaHabitacion.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      habitacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha_entrada: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_salida: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      numero_huespedes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ReservaHabitacion",
      tableName: "reservas_habitacion",
      timestamps: true,
    },
  );
  return ReservaHabitacion;
};
