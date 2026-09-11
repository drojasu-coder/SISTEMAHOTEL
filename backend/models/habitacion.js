'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Habitacion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Habitacion.belongsTo(models.Sucursal,{foreignKey:'sucursal_id'});
      Habitacion.belongsTo(models.TipoHabitacion,{foreignKey:'tipo_habitacion_id'});
    }
  }
  Habitacion.init({
    sucursal_id: DataTypes.INTEGER,
    tipo_habitacion_id: DataTypes.INTEGER,
    numero: DataTypes.STRING,
    estado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Habitacion',
    tableName: 'habitaciones'
  });
  return Habitacion;
};