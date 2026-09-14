"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Terapeuta extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Terapeuta.hasMany(models.CitaBienestar, { foreignKey: "terapeuta_id" });
    }
  }
  Terapeuta.init(
    {
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Terapeuta",
      tableName: "terapeutas",
      timestamps: true,
    },
  );
  return Terapeuta;
};
