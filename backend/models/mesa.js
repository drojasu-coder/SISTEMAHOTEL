'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Mesa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Mesa.belongsTo(models.Sucursal,{foreignKey:'sucursal_id'});
    }
  }
  Mesa.init({
    sucursal_id: DataTypes.INTEGER,
    zona: DataTypes.STRING,
    capacidad: DataTypes.INTEGER,
    estado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Mesa',
    tableName: 'mesas'
  });
  return Mesa;
};