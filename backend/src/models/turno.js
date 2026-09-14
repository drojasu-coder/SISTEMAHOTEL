"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Turno extends Model {
    static associate(models) {
      Turno.belongsTo(models.Empleado, { foreignKey: "empleado_id" });
    }
  }
  Turno.init(
    {
      empleado_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: DataTypes.TIME,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Turno",
      tableName: "turnos",
      timestamps: true,
    },
  );
  return Turno;
};
