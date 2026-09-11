'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Promocion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Promocion.init({
    nombre: DataTypes.STRING,
    tipo_descuento: DataTypes.STRING,
    valor_descuento: DataTypes.DECIMAL,
    aplica_a: DataTypes.STRING,
    fecha_inicio: DataTypes.DATEONLY,
    fecha_fin: DataTypes.DATEONLY,
    activa: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Promocion',
    tableName: 'promociones'
  });
  return Promocion;
};