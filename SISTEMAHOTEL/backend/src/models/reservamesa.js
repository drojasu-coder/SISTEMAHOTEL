"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaMesa extends Model {
    static associate(models) {
      ReservaMesa.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      ReservaMesa.belongsTo(models.Mesa, { foreignKey: "mesa_id" });
    }
  }
  ReservaMesa.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      mesa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hora: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      numero_comensales: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "confirmada",
      },
    },
    {
      sequelize,
      modelName: "ReservaMesa",
      tableName: "reservas_mesa",
      timestamps: true,
    },
  );
  return ReservaMesa;
};
