'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Empleado extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Empleado.belongsTo(models.Usuario,{foreignKey:'usuario_id'});
      Empleado.belongsTo(models.Sucursal,{foreignKey:'sucursal_id'});
      
    }
  }
  Empleado.init({
    usuario_id: DataTypes.INTEGER,
    sucursal_id: DataTypes.INTEGER,
    area: DataTypes.STRING,
    fecha_contratacion: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'Empleado',
    tableName: 'empleados'
  });
  return Empleado;
};