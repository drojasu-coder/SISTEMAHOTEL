"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Mesa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Mesa.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
      Mesa.hasMany(models.ReservaMesa, { foreignKey: "mesa_id" });
    }
  }
  Mesa.init(
    {
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      zona: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      capacidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "disponible",
      },
    },
    {
      sequelize,
      modelName: "Mesa",
      tableName: "mesas",
      timestamps: true,
    },
  );
  return Mesa;
};
