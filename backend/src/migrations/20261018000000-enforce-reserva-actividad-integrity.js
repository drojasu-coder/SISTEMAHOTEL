"use strict";

const TABLE_NAME =
  "reservas_actividad";

const CONSTRAINTS = {
  estado:
    "reservas_actividad_estado_valid_check",
  horario:
    "reservas_actividad_hora_rango_valid_check",
  total:
    "reservas_actividad_total_nonnegative_check",
};

module.exports = {
  async up(
    queryInterface
  ) {
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
              WHERE estado NOT IN ('confirmada', 'cancelada', 'completada')
                 OR hora_inicio >= hora_fin
                 OR total < 0
              LIMIT 1
            `,
            { transaction }
          );

        if (
          invalidRows.length > 0
        ) {
          throw new Error(
            "No se pueden agregar los constraints de reservas_actividad: existen filas inválidas"
          );
        }

        await queryInterface.sequelize.query(
          `
            ALTER TABLE "${TABLE_NAME}"
            ADD CONSTRAINT "${CONSTRAINTS.estado}"
            CHECK (estado IN ('confirmada', 'cancelada', 'completada'))
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            ALTER TABLE "${TABLE_NAME}"
            ADD CONSTRAINT "${CONSTRAINTS.horario}"
            CHECK (hora_inicio < hora_fin)
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            ALTER TABLE "${TABLE_NAME}"
            ADD CONSTRAINT "${CONSTRAINTS.total}"
            CHECK (total >= 0)
          `,
          { transaction }
        );
      }
    );
  },

  async down(
    queryInterface
  ) {
    await queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.removeConstraint(
          TABLE_NAME,
          CONSTRAINTS.total,
          { transaction }
        );

        await queryInterface.removeConstraint(
          TABLE_NAME,
          CONSTRAINTS.horario,
          { transaction }
        );

        await queryInterface.removeConstraint(
          TABLE_NAME,
          CONSTRAINTS.estado,
          { transaction }
        );
      }
    );
  },
};
