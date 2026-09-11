'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Proveedor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Proveedor.hasMany(models.ProveedorProducto,{foreignKey:'proveedor_id'});
      Proveedor.hasMany(models.CuentaPorPagar,{foreignKey:'proveedor_id'});
    }
  }
  Proveedor.init({
    nombre: DataTypes.STRING,
    nit: DataTypes.STRING,
    contacto: DataTypes.STRING,
    telefono: DataTypes.STRING,
    email: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Proveedor',
    tableName: 'proveedores'
  });
  return Proveedor;
};