"use strict";

const CONSTRAINTS = {
  pagoMonto: "pagos_monto_positive_check",
  pagoOrigen: "pagos_exactly_one_origin_check",
  pagoEstado: "pagos_estado_valid_check",
  pagoMetodo: "pagos_metodo_valid_check",
  pagoTipo: "pagos_tipo_pago_valid_check",
  reembolsoMonto: "reembolsos_monto_positive_check",
  reembolsoEstado: "reembolsos_estado_valid_check",
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.sequelize.query(
          'LOCK TABLE "pagos", "reembolsos" IN ACCESS EXCLUSIVE MODE',
          { transaction }
        );

        const [invalidRows] =
          await queryInterface.sequelize.query(
            `
              SELECT 'pagos' AS tabla, id
              FROM "pagos"
              WHERE monto <= 0
                 OR ((reserva_habitacion_id IS NULL) = (carrito_id IS NULL))
                 OR estado NOT IN (
                   'pendiente',
                   'procesando',
                   'aprobado',
                   'rechazado',
                   'cancelado',
                   'reembolsado',
                   'reembolsado_parcial'
                 )
                 OR metodo NOT IN ('tarjeta', 'efectivo', 'transferencia')
                 OR tipo_pago NOT IN ('total', 'anticipo', 'saldo')
              UNION ALL
              SELECT 'reembolsos' AS tabla, id
              FROM "reembolsos"
              WHERE monto <= 0
                 OR estado NOT IN ('pendiente', 'aprobado', 'rechazado')
              LIMIT 1
            `,
            { transaction }
          );

        if (invalidRows.length > 0) {
          throw new Error(
            "No se pueden agregar los constraints de pagos y reembolsos: existen filas inválidas"
          );
        }

        await queryInterface.sequelize.query(
          `
            ALTER TABLE "pagos"
            ADD CONSTRAINT "${CONSTRAINTS.pagoMonto}"
            CHECK (monto > 0),
            ADD CONSTRAINT "${CONSTRAINTS.pagoOrigen}"
            CHECK ((reserva_habitacion_id IS NULL) <> (carrito_id IS NULL)),
            ADD CONSTRAINT "${CONSTRAINTS.pagoEstado}"
            CHECK (
              estado IN (
                'pendiente',
                'procesando',
                'aprobado',
                'rechazado',
                'cancelado',
                'reembolsado',
                'reembolsado_parcial'
              )
            ),
            ADD CONSTRAINT "${CONSTRAINTS.pagoMetodo}"
            CHECK (metodo IN ('tarjeta', 'efectivo', 'transferencia')),
            ADD CONSTRAINT "${CONSTRAINTS.pagoTipo}"
            CHECK (tipo_pago IN ('total', 'anticipo', 'saldo'))
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            ALTER TABLE "reembolsos"
            ADD CONSTRAINT "${CONSTRAINTS.reembolsoMonto}"
            CHECK (monto > 0),
            ADD CONSTRAINT "${CONSTRAINTS.reembolsoEstado}"
            CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'))
          `,
          { transaction }
        );
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.removeConstraint(
          "reembolsos",
          CONSTRAINTS.reembolsoEstado,
          { transaction }
        );
        await queryInterface.removeConstraint(
          "reembolsos",
          CONSTRAINTS.reembolsoMonto,
          { transaction }
        );
        await queryInterface.removeConstraint(
          "pagos",
          CONSTRAINTS.pagoTipo,
          { transaction }
        );
        await queryInterface.removeConstraint(
          "pagos",
          CONSTRAINTS.pagoMetodo,
          { transaction }
        );
        await queryInterface.removeConstraint(
          "pagos",
          CONSTRAINTS.pagoEstado,
          { transaction }
        );
        await queryInterface.removeConstraint(
          "pagos",
          CONSTRAINTS.pagoOrigen,
          { transaction }
        );
        await queryInterface.removeConstraint(
          "pagos",
          CONSTRAINTS.pagoMonto,
          { transaction }
        );
      }
    );
  },
};
