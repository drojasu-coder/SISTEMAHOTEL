"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaActividad extends Model {
    static associate(models) {
      ReservaActividad.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      ReservaActividad.belongsTo(models.RecursoActividad, { foreignKey: "recurso_id" });
      ReservaActividad.belongsTo(models.Instructor, { foreignKey: "instructor_id" });
    }
  }
  ReservaActividad.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      recurso_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      instructor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      con_equipo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "confirmada",
      },
    },
    {
      sequelize,
      modelName: "ReservaActividad",
      tableName: "reservas_actividad",
      timestamps: true,
    },
  );
  return ReservaActividad;
};
