"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TipoHabitacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TipoHabitacion.hasMany(models.Habitacion, { foreignKey: "tipo_habitacion_id" });
    }
  }
  TipoHabitacion.init(
    {
      nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      capacidad_maxima: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tarifa_noche: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TipoHabitacion",
      tableName: "tipos_habitacion",
      timestamps: true,
    },
  );
  return TipoHabitacion;
};
