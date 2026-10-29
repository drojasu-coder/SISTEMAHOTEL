"use strict";
module.exports = (sequelize, DataTypes) => sequelize.define("GoogleIdentity", {
  sub: { type: DataTypes.STRING(255), primaryKey: true, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
}, { tableName: "google_identities", timestamps: true });
