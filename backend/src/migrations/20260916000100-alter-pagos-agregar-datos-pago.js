"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("pagos", "moneda", {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: "GTQ",
    });
    await queryInterface.addColumn("pagos", "tipo_pago", {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "total",
    });
    await queryInterface.addColumn("pagos", "pasarela", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn("pagos", "idempotency_key", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn("pagos", "fecha_pago", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("pagos", "codigo_error_externo", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("pagos", "mensaje_error", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addIndex("pagos", ["carrito_id"], { name: "pagos_carrito_id_idx" });
    await queryInterface.addIndex("pagos", ["reserva_habitacion_id"], {
      name: "pagos_reserva_habitacion_id_idx",
    });
    await queryInterface.addIndex("pagos", ["estado"], { name: "pagos_estado_idx" });

    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.addIndex("pagos", ["idempotency_key"], {
        name: "pagos_idempotency_key_unique_idx",
        unique: true,
        where: { idempotency_key: { [Sequelize.Op.ne]: null } },
      });
    } else {
      await queryInterface.addIndex("pagos", ["idempotency_key"], {
        name: "pagos_idempotency_key_unique_idx",
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("pagos", "pagos_idempotency_key_unique_idx");
    await queryInterface.removeIndex("pagos", "pagos_estado_idx");
    await queryInterface.removeIndex("pagos", "pagos_reserva_habitacion_id_idx");
    await queryInterface.removeIndex("pagos", "pagos_carrito_id_idx");
    await queryInterface.removeColumn("pagos", "mensaje_error");
    await queryInterface.removeColumn("pagos", "codigo_error_externo");
    await queryInterface.removeColumn("pagos", "fecha_pago");
    await queryInterface.removeColumn("pagos", "idempotency_key");
    await queryInterface.removeColumn("pagos", "pasarela");
    await queryInterface.removeColumn("pagos", "tipo_pago");
    await queryInterface.removeColumn("pagos", "moneda");
  },
};
