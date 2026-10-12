"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reembolsos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      pago_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "pagos",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      moneda: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "GTQ",
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "pendiente",
      },
      id_reembolso_externo: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      motivo: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      fecha_reembolso: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("reembolsos", ["pago_id"], {
      name: "reembolsos_pago_id_idx",
    });
    await queryInterface.addIndex("reembolsos", ["id_reembolso_externo"], {
      name: "reembolsos_id_reembolso_externo_unique_idx",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("reembolsos", "reembolsos_id_reembolso_externo_unique_idx");
    await queryInterface.removeIndex("reembolsos", "reembolsos_pago_id_idx");
    await queryInterface.dropTable("reembolsos");
  },
};
