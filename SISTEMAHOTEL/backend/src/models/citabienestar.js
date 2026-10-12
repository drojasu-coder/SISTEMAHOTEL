"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CitaBienestar extends Model {
    static associate(models) {
      CitaBienestar.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      CitaBienestar.belongsTo(models.ServicioBienestar, { foreignKey: "servicio_bienestar_id" });
      CitaBienestar.belongsTo(models.Terapeuta, { foreignKey: "terapeuta_id" });
    }
  }
  CitaBienestar.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      servicio_bienestar_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      terapeuta_id: {
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
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "confirmada",
      },
    },
    {
      sequelize,
      modelName: "CitaBienestar",
      tableName: "citas_bienestar",
      timestamps: true,
    },
  );
  return CitaBienestar;
};
