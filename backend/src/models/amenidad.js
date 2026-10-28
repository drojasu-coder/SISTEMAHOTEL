"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Amenidad extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Amenidad.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
      Amenidad.hasMany(models.ReservaAmenidad, { foreignKey: "amenidad_id" });
    }
  }
  Amenidad.init(
    {
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      aforo_maximo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // false = espacio compartido de libre acceso, sin reservas.
      reservable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      imagen_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "Amenidad",
      tableName: "amenidades",
      timestamps: true,
    },
  );
  return Amenidad;
};
