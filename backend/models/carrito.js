'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Carrito extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Carrito.belongsTo(models.Usuario,{foreignKey:'usuario_id'});
    }
  }
  Carrito.init({
    usuario_id: DataTypes.INTEGER,
    estado: DataTypes.STRING,
    expira_en: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Carrito',
    tableName: 'carritos'
  });
  return Carrito;
};