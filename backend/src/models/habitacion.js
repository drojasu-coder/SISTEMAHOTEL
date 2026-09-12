"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Habitacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Habitacion.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
      Habitacion.belongsTo(models.TipoHabitacion, { foreignKey: "tipo_habitacion_id" });
      Habitacion.hasMany(models.ReservaHabitacion, { foreignKey: "habitacion_id" });
    }
  }
  Habitacion.init(
    {
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo_habitacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      numero: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "disponible",
      },
    },
    {
      sequelize,
      modelName: "Habitacion",
      tableName: "habitaciones",
      timestamps: true,
    },
  );
  return Habitacion;
};
