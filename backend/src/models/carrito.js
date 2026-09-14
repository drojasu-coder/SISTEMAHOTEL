"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Carrito extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Carrito.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      Carrito.hasMany(models.CarritoItem, { foreignKey: "carrito_id" });
    }
  }
  Carrito.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "activo",
      },
      expira_en: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Carrito",
      tableName: "carritos",
      timestamps: true,
    },
  );
  return Carrito;
};
