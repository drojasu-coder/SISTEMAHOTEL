'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Salon extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Salon.belongsTo(models.Sucursal,{foreignKey:'sucursal_id'});
    }
  }
  Salon.init({
    sucursal_id: DataTypes.INTEGER,
    nombre: DataTypes.STRING,
    capacidad_maxima: DataTypes.INTEGER,
    tarifa_base: DataTypes.DECIMAL,
    descripcion: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Salon',
    tableName: 'salones'
  });
  return Salon;
};