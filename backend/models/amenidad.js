'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Amenidad extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Amenidad.belongsTo(models.Sucursal,{foreignKey:'sucursal_id'});
    }
  }
  Amenidad.init({
    sucursal_id: DataTypes.INTEGER,
    nombre: DataTypes.STRING,
    aforo_maximo: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Amenidad',
    tableName: 'amenidades'
  });
  return Amenidad;
};