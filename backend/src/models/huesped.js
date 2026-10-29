"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  /**
   * Huésped atendido en recepción sin cuenta en la plataforma. No es un usuario:
   * no tiene contraseña ni acceso; solo identifica al titular de una reserva presencial.
   */
  class Huesped extends Model {
    static associate(models) {
      Huesped.belongsTo(models.Sucursal, { foreignKey: "sucursal_id" });
      Huesped.belongsTo(models.Usuario, { foreignKey: "registrado_por_usuario_id", as: "registradoPor" });
      Huesped.hasMany(models.ReservaHabitacion, { foreignKey: "huesped_id" });
    }
  }
  Huesped.init(
    {
      nombre_completo: { type: DataTypes.STRING(150), allowNull: false },
      telefono: { type: DataTypes.STRING(30), allowNull: true },
      email: { type: DataTypes.STRING(150), allowNull: true },
      sucursal_id: { type: DataTypes.INTEGER, allowNull: false },
      registrado_por_usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Huesped",
      tableName: "huespedes",
      timestamps: true,
    },
  );
  return Huesped;
};
