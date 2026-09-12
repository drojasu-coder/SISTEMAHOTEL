"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chofer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Chofer.hasMany(models.ReservaTransporte, { foreignKey: "chofer_id" });
    }
  }
  Chofer.init(
    {
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      licencia: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Chofer",
      tableName: "choferes",
      timestamps: true,
    },
  );
  return Chofer;
};
