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
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Sucursal',
    tableName: 'sucursales',
    timestamps: true
  });
  return Sucursal;
};