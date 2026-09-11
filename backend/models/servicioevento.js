'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServicioEvento extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ServicioEvento.init({
    nombre: DataTypes.STRING,
    precio: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'ServicioEvento',
    tableName: 'servicios_evento'
  });
  return ServicioEvento;
};