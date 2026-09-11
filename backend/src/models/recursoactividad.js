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
      RecursoActividad.belongsTo(models.Sucursal, {
        foreignKey: "sucursal_id",
      });
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
