'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TipoHabitacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TipoHabitacion.hasMany(models.Habitacion,{foreignKey:'tipo_habitacion_id'});
    }
  }
  TipoHabitacion.init({
    nombre: DataTypes.STRING,
    capacidad_maxima: DataTypes.INTEGER,
    tarifa_noche: DataTypes.DECIMAL,
    descripcion: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TipoHabitacion',
    tableName: 'tipos_habitacion'
  });
  return TipoHabitacion;
};