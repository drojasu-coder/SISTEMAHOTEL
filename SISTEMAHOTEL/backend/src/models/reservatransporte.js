"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaTransporte extends Model {
    static associate(models) {
      ReservaTransporte.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      ReservaTransporte.belongsTo(models.Chofer, { foreignKey: "chofer_id" });
      ReservaTransporte.belongsTo(models.Vehiculo, { foreignKey: "vehiculo_id" });
    }
  }
  ReservaTransporte.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      chofer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      vehiculo_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      origen: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      destino: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      fecha_hora: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      numero_pasajeros: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
    },
    {
      sequelize,
      modelName: "ReservaTransporte",
      tableName: "reservas_transporte",
      timestamps: true,
    },
  );
  return ReservaTransporte;
};
