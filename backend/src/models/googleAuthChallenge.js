"use strict";
module.exports = (sequelize, DataTypes) => sequelize.define("GoogleAuthChallenge", {
  id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
  nonce_hash: { type: DataTypes.STRING(64), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: "google_auth_challenges", timestamps: false });
