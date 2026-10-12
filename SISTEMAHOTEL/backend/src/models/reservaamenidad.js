"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaAmenidad extends Model {
    static associate(models) {
      ReservaAmenidad.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      ReservaAmenidad.belongsTo(models.Amenidad, { foreignKey: "amenidad_id" });
    }
  }
  ReservaAmenidad.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amenidad_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      franja_horaria: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      mobiliario: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      codigo_qr: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "confirmada",
      },
    },
    {
      sequelize,
      modelName: "ReservaAmenidad",
      tableName: "reservas_amenidad",
      timestamps: true,
    },
  );
  return ReservaAmenidad;
};
