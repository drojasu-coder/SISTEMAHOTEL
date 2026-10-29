"use strict";

// No normaliza ni elimina cuentas. Si hay correos equivalentes, aborta íntegramente.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX usuarios_email_normalized_unique ON usuarios (lower(btrim(email)))',
        { transaction },
      );
      await queryInterface.createTable("google_identities", {
        sub: { type: Sequelize.STRING(255), primaryKey: true, allowNull: false },
        usuario_id: {
          type: Sequelize.INTEGER, allowNull: false, unique: true,
          references: { model: "usuarios", key: "id" }, onDelete: "RESTRICT", onUpdate: "CASCADE",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.createTable("google_auth_challenges", {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        nonce_hash: { type: Sequelize.STRING(64), allowNull: false },
        expires_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex("google_auth_challenges", ["expires_at"], { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.dropTable("google_auth_challenges", { transaction });
      await queryInterface.dropTable("google_identities", { transaction });
      await queryInterface.sequelize.query('DROP INDEX usuarios_email_normalized_unique', { transaction });
    });
  },
};
