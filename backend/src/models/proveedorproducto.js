'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProveedorProducto extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProveedorProducto.belongsTo(models.Proveedor,{foreignKey:'proveedor_id'});
    }
  }
  ProveedorProducto.init({
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nombre_producto: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ProveedorProducto',
    tableName: 'proveedor_productos',
    timestamps: true
  });
  return ProveedorProducto;
};