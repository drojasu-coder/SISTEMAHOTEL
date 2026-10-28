"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  /** Sede adicional autorizada para un empleado (la principal es empleados.sucursal_id). */
  class EmpleadoSede extends Model {
    static associate(models) {
      EmpleadoSede.belongsTo(models.Empleado, { foreignKey: "empleado_id" });
      EmpleadoSede.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
    }
  }
  EmpleadoSede.init(
    {
      empleado_id: { type: DataTypes.INTEGER, allowNull: false },
      sucursal_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "EmpleadoSede",
      tableName: "empleado_sedes",
      timestamps: true,
    },
  );
  return EmpleadoSede;
};
