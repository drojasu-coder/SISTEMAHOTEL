"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Instructor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Instructor.hasMany(models.ReservaActividad, { foreignKey: "instructor_id" });
    }
  }
  Instructor.init(
    {
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      especialidad: {
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
      modelName: "Instructor",
      tableName: "instructores",
      timestamps: true,
    },
  );
  return Instructor;
};
