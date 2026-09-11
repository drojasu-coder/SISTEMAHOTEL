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
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    area: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    fecha_contratacion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Empleado',
    tableName: 'empleados',
    timestamps: true
  });
  return Empleado;
};