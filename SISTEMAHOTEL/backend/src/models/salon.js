"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Salon extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Salon.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
      Salon.hasMany(models.ReservaEvento, { foreignKey: "salon_id" });
    }
  }
  Salon.init(
    {
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      capacidad_maxima: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tarifa_base: {
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
      modelName: "Salon",
      tableName: "salones",
      timestamps: true,
    },
  );
  return Salon;
};
