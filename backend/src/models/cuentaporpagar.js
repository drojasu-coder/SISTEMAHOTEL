'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CuentaPorPagar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CuentaPorPagar.belongsTo(models.Proveedor,{foreignKey:'proveedor_id'});
    }
  }
  CuentaPorPagar.init({
    proveedor_id: DataTypes.INTEGER,
    monto: DataTypes.DECIMAL,
    fecha_vencimiento: DataTypes.DATEONLY,
    estado: DataTypes.STRING,
    factura_referencia: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CuentaPorPagar',
    tableName: 'cuentas_por_pagar'
  });
  return CuentaPorPagar;
};