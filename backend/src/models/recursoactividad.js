"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RecursoActividad extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      RecursoActividad.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
      RecursoActividad.hasMany(models.ReservaActividad, { foreignKey: "recurso_id" });
    }
  }
  RecursoActividad.init(
    {
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      precio_hora: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      precio_equipo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      precio_instructor_hora: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      // "por_hora": reserva exclusiva del recurso; "experiencia": salida de duración fija con cupo compartido.
      modalidad: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "por_hora",
      },
      duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      cupo_maximo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      precio_persona: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      imagen_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      // Horario de reserva o de salidas (hora de Guatemala); sin ambos valores no se ofrecen franjas.
      hora_apertura: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },
      hora_cierre: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "RecursoActividad",
      tableName: "recursos_actividad",
      timestamps: true,
    },
  );
  return RecursoActividad;
};
