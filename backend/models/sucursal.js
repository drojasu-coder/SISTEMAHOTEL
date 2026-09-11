'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sucursal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Sucursal.hasMany(models.Habitacion,{foreignKey: 'sucursal_id'});
      Sucursal.hasMany(models.Parqueo,{foreignKey:'sucursal_id'})
      Sucursal.hasMany(models.Salon,{foreignKey:'sucursal_id'});
      Sucursal.hasMany(models.Mesa,{foreignKey:'sucursal_id'});
      Sucursal.hasMany(models.RecursoActividad,{foreignKey:'sucursal_id'});
      Sucursal.hasMany(models.Amenidad,{foreignKey:'sucursal_id'});
      Sucursal.hasMany(models.Empleado,{foreignKey:'sucursal_id'});
    }
  }
  Sucursal.init({
    nombre: DataTypes.STRING,
    direccion: DataTypes.STRING,
    ciudad: DataTypes.STRING,
    telefono: DataTypes.STRING,
    activa: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Sucursal',
    tableName: 'sucursales'
  });
  return Sucursal;
};