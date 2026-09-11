'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vehiculo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Vehiculo.init({
    tipo: DataTypes.STRING,
    capacidad: DataTypes.INTEGER,
    placa: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Vehiculo',
    tableName: 'vehiculos'
  });
  return Vehiculo;
};