"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ServicioBienestar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ServicioBienestar.hasMany(models.CitaBienestar, { foreignKey: "servicio_bienestar_id" });
      // NULL = servicio general anterior a la vinculación por sede.
      ServicioBienestar.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
    }
  }
  ServicioBienestar.init(
    {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      imagen_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Horario de atención (hora de Guatemala); sin ambos valores no se ofrecen citas.
      hora_apertura: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },
      hora_cierre: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "ServicioBienestar",
      tableName: "servicios_bienestar",
      timestamps: true,
    },
  );
  return ServicioBienestar;
};
