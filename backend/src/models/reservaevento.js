"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReservaEvento extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ReservaEvento.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
      ReservaEvento.belongsTo(models.Salon, { foreignKey: "salon_id" });
      ReservaEvento.hasMany(models.ReservaEventoServicio, { foreignKey: "reserva_evento_id" });
    }
  }
  ReservaEvento.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      salon_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo_evento: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      numero_invitados: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "cotizacion",
      },
      anticipo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ReservaEvento",
      tableName: "reservas_evento",
      timestamps: true,
    },
  );
  return ReservaEvento;
};
