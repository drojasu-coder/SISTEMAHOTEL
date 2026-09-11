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
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    tipo_descuento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    valor_descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    aplica_a: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Promocion',
    tableName: 'promociones',
    timestamps: true
  });
  return Promocion;
};