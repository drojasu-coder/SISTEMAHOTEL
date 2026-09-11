'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Factura extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Factura.init({
    usuario_id: DataTypes.INTEGER,
    nit: DataTypes.STRING,
    nombre_fiscal: DataTypes.STRING,
    direccion_fiscal: DataTypes.STRING,
    subtotal: DataTypes.DECIMAL,
    iva: DataTypes.DECIMAL,
    total: DataTypes.DECIMAL,
    estado: DataTypes.STRING,
    fecha_emision: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Factura',
  });
  return Factura;
};