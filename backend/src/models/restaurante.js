"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Restaurante extends Model {
    static associate(models) {
      Restaurante.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
      Restaurante.hasMany(models.Mesa, { foreignKey: "restaurante_id" });
      Restaurante.hasMany(models.ProductoMenu, { foreignKey: "restaurante_id" });
    }
  }
  Restaurante.init(
    {
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Restaurante",
      tableName: "restaurantes",
      timestamps: true,
    },
  );
  return Restaurante;
};
