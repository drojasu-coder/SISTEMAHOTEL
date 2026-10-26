"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("confirmaciones_subida", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      sede_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "sucursales",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      temp_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      final_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("confirmaciones_subida", ["token_hash"], {
      unique: true,
      name: "idx_confirmaciones_subida_token_hash",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("confirmaciones_subida");
  },
};
