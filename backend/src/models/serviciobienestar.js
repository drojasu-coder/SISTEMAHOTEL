"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ServicioBienestar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ServicioBienestar.hasMany(models.CitaBienestar, { foreignKey: "servicio_bienestar_id" });
    }
  }
  ServicioBienestar.init(
    {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ServicioBienestar",
      tableName: "servicios_bienestar",
      timestamps: true,
    },
  );
  return ServicioBienestar;
};
