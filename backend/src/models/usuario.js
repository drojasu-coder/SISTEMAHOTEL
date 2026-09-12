"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Usuario.hasOne(models.Empleado, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.Carrito, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.Factura, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.BoletoParque, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.ReservaHabitacion, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.ReservaEvento, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.ReservaMesa, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.ReservaActividad, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.ReservaAmenidad, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.CitaBienestar, { foreignKey: "usuario_id" });
      Usuario.hasMany(models.ReservaTransporte, { foreignKey: "usuario_id" });
    }
  }
  Usuario.init(
    {
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      rol: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Usuario",
      tableName: "usuarios",
      timestamps: true,
    },
  );
  return Usuario;
};
