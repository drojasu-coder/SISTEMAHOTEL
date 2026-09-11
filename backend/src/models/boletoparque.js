'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BoletoParque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BoletoParque.belongsTo(models.Usuario,{foreignKey:'usuario_id'});
    }
  }
  BoletoParque.init({
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha_visita: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    tipo_boleto: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    codigo_qr: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'valido'
    }
  }, {
    sequelize,
    modelName: 'BoletoParque',
    tableName: 'boletos_parque',
    timestamps: true
  });
  return BoletoParque;
};