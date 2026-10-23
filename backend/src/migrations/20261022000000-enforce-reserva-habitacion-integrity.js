"use strict";

const TABLE_NAME =
  "reservas_habitacion";

const CONSTRAINTS = {
  dateRange:
    "reservas_habitacion_fecha_rango_valid_check",
  total:
    "reservas_habitacion_total_nonnegative_check",
  estado:
    "reservas_habitacion_estado_valid_check",
  guests:
    "reservas_habitacion_huespedes_positive_check",
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.sequelize.query(
          `LOCK TABLE "${TABLE_NAME}" IN ACCESS EXCLUSIVE MODE`,
          { transaction }
        );

        const [invalidRows] =
          await queryInterface.sequelize.query(
            `
              SELECT id
              FROM "${TABLE_NAME}"
              WHERE fecha_salida <= fecha_entrada
                 OR total < 0
                 OR estado NOT IN (
                   'pendiente',
                   'confirmada',
                   'cancelada',
                   'finalizada',
                   'expirada'
                 )
                 OR numero_huespedes < 1
              LIMIT 1
            `,
            { transaction }
          );

        if (invalidRows.length > 0) {
          throw new Error(
            "No se pueden agregar los constraints de reservas_habitacion: existen filas inválidas"
          );
        }

        await queryInterface.sequelize.query(
          `
            ALTER TABLE "${TABLE_NAME}"
            ADD CONSTRAINT "${CONSTRAINTS.dateRange}"
            CHECK (fecha_salida > fecha_entrada),
            ADD CONSTRAINT "${CONSTRAINTS.total}"
            CHECK (total >= 0),
            ADD CONSTRAINT "${CONSTRAINTS.estado}"
            CHECK (
              estado IN (
                'pendiente',
                'confirmada',
                'cancelada',
                'finalizada',
                'expirada'
              )
            ),
            ADD CONSTRAINT "${CONSTRAINTS.guests}"
            CHECK (numero_huespedes >= 1)
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
          TABLE_NAME,
          CONSTRAINTS.guests,
          { transaction }
        );
        await queryInterface.removeConstraint(
          TABLE_NAME,
          CONSTRAINTS.estado,
          { transaction }
        );
        await queryInterface.removeConstraint(
          TABLE_NAME,
          CONSTRAINTS.total,
          { transaction }
        );
        await queryInterface.removeConstraint(
          TABLE_NAME,
          CONSTRAINTS.dateRange,
          { transaction }
        );
      }
    );
  },
};
