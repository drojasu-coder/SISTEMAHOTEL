import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  QueryTypes,
} from "sequelize";

import {
  createHotelFixture,
} from "../fixtures/hotel";

import {
  createTestUser,
} from "../fixtures/users";

const db =
  require("../../src/models");

const {
  ReservaHabitacion,
  sequelize,
} = db;

const QA_EMAIL_PATTERN =
  "qa-rh-data-024-%@hotel.test";

const VALID_STATES = [
  "pendiente",
  "confirmada",
  "cancelada",
  "finalizada",
  "expirada",
] as const;

type CheckConstraint = {
  name: string;
  definition: string;
  validated: boolean;
};

type PersistedReservation = {
  id: number;
  fecha_entrada: string;
  fecha_salida: string;
  numero_huespedes: number;
  estado: string;
  total: string;
};

type InvalidCreateOptions = {
  label: string;
  email: string;
  expected: string;
  values: Partial<{
    fecha_entrada: string;
    fecha_salida: string;
    numero_huespedes: number;
    estado: string;
    total: string;
  }>;
};

const errorEvidence = (
  error: unknown
) => {
  const sequelizeError =
    error as any;
  const databaseError =
    sequelizeError?.parent ??
    sequelizeError?.original;

  return {
    layer:
      error === null
        ? null
        : sequelizeError?.name ===
            "SequelizeValidationError"
          ? "sequelize_model"
          : databaseError
            ? "postgresql"
            : "unknown",
    name:
      error instanceof Error
        ? error.name
        : null,
    message:
      error instanceof Error
        ? error.message
        : null,
    postgresCode:
      databaseError?.code ??
      null,
    constraint:
      databaseError?.constraint ??
      sequelizeError?.constraint ??
      null,
    detail:
      databaseError?.detail ??
      null,
  };
};

const attemptInvalidCreate = async ({
  label,
  email,
  expected,
  values,
}: InvalidCreateOptions) => {
  const {
    usuario,
  } = await createTestUser({
    email,
  });
  const {
    habitacion,
  } = await createHotelFixture({
    capacidad: 2,
    tarifa: 100,
  });

  const reservationValues = {
    usuario_id:
      usuario.id,
    habitacion_id:
      habitacion.id,
    fecha_entrada:
      "2036-01-10",
    fecha_salida:
      "2036-01-11",
    numero_huespedes:
      1,
    estado:
      "pendiente",
    total:
      "100.00",
    ...values,
  };

  let accepted = false;
  let error: unknown = null;

  try {
    await ReservaHabitacion.create(
      reservationValues
    );
    accepted = true;
  } catch (caughtError) {
    error = caughtError;
  }

  const persistedRows =
    await sequelize.query(
      `
        SELECT
          id,
          fecha_entrada::text AS fecha_entrada,
          fecha_salida::text AS fecha_salida,
          numero_huespedes,
          estado,
          total::text AS total
        FROM reservas_habitacion
        WHERE usuario_id = :usuarioId
          AND habitacion_id = :habitacionId
          AND fecha_entrada = CAST(:fechaEntrada AS date)
        ORDER BY id;
      `,
      {
        replacements: {
          usuarioId:
            usuario.id,
          habitacionId:
            habitacion.id,
          fechaEntrada:
            reservationValues.fecha_entrada,
        },
        type:
          QueryTypes.SELECT,
      }
    ) as PersistedReservation[];

  const evidence = {
    accepted,
    rejected:
      !accepted,
    error:
      errorEvidence(error),
    persisted: {
      count:
        persistedRows.length,
      rows:
        persistedRows,
    },
  };

  console.log(
    `[QA-RH-DATA-CANDIDATE-024][${label}]`,
    JSON.stringify(
      evidence,
      null,
      2
    )
  );

  expect(
    {
      accepted:
        evidence.accepted,
      persistedCount:
        evidence.persisted.count,
    },
    expected
  ).toEqual({
    accepted: false,
    persistedCount: 0,
  });
};

describe(
  "Integridad persistida de ReservaHabitacion",
  () => {
    beforeAll(
      async () => {
        const constraints =
          await sequelize.query(
            `
              SELECT
                constraint_row.conname AS name,
                pg_get_constraintdef(
                  constraint_row.oid,
                  true
                ) AS definition,
                constraint_row.convalidated AS validated
              FROM pg_constraint AS constraint_row
              INNER JOIN pg_class AS table_row
                ON table_row.oid = constraint_row.conrelid
              INNER JOIN pg_namespace AS namespace_row
                ON namespace_row.oid = table_row.relnamespace
              WHERE namespace_row.nspname = 'public'
                AND table_row.relname = 'reservas_habitacion'
                AND constraint_row.contype = 'c'
              ORDER BY constraint_row.conname;
            `,
            {
              type:
                QueryTypes.SELECT,
            }
          ) as CheckConstraint[];

        console.log(
          "[QA-RH-DATA-CANDIDATE-024][PRECHECK][POSTGRESQL CHECK CONSTRAINTS]",
          JSON.stringify(
            constraints,
            null,
            2
          )
        );
        console.log(
          "[QA-RH-DATA-CANDIDATE-024][DOMAIN]",
          JSON.stringify({
            estado:
              VALID_STATES,
            numero_huespedes:
              "integer >= 1",
          })
        );
      }
    );

    afterEach(
      async () => {
        const deletedRows =
          await sequelize.query(
            `
              DELETE FROM reservas_habitacion AS reservation
              USING usuarios AS qa_user
              WHERE reservation.usuario_id = qa_user.id
                AND qa_user.email LIKE :emailPattern
              RETURNING reservation.id;
            `,
            {
              replacements: {
                emailPattern:
                  QA_EMAIL_PATTERN,
              },
              type:
                QueryTypes.DELETE,
            }
          ) as unknown;

        const invalidRows =
          await sequelize.query(
            `
              SELECT COUNT(*)::integer AS count
              FROM reservas_habitacion AS reservation
              INNER JOIN usuarios AS qa_user
                ON qa_user.id = reservation.usuario_id
              WHERE qa_user.email LIKE :emailPattern
                AND (
                  reservation.fecha_salida <= reservation.fecha_entrada
                  OR reservation.total < 0
                  OR reservation.estado NOT IN (
                    'pendiente',
                    'confirmada',
                    'cancelada',
                    'finalizada',
                    'expirada'
                  )
                  OR reservation.numero_huespedes < 1
                );
            `,
            {
              replacements: {
                emailPattern:
                  QA_EMAIL_PATTERN,
              },
              type:
                QueryTypes.SELECT,
            }
          ) as Array<{
            count: number;
          }>;

        console.log(
          "[QA-RH-DATA-CANDIDATE-024][CLEANUP]",
          JSON.stringify({
            deleteResult:
              deletedRows,
            invalidRowsLeft:
              invalidRows[0]?.count ??
              null,
          })
        );

        expect(
          invalidRows[0]?.count,
          "El cleanup debe dejar cero filas estructuralmente inválidas propias de QA-RH-DATA-CANDIDATE-024"
        ).toBe(0);
      }
    );

    it(
      "QA-RH-DATA-CANDIDATE-024 A rechaza fecha_salida igual a fecha_entrada",
      async () => {
        await attemptInvalidCreate({
          label: "A_DATE_RANGE_EQUAL",
          email:
            "qa-rh-data-024-a@hotel.test",
          expected:
            "ReservaHabitacion.create debe rechazar fecha_salida <= fecha_entrada y PostgreSQL no debe persistir la fila",
          values: {
            fecha_entrada:
              "2036-01-10",
            fecha_salida:
              "2036-01-10",
          },
        });
      }
    );

    it(
      "QA-RH-DATA-CANDIDATE-024 B rechaza total negativo",
      async () => {
        await attemptInvalidCreate({
          label: "B_NEGATIVE_TOTAL",
          email:
            "qa-rh-data-024-b@hotel.test",
          expected:
            "ReservaHabitacion.create debe rechazar total=-1.00 y PostgreSQL no debe persistir la fila",
          values: {
            total:
              "-1.00",
          },
        });
      }
    );

    it(
      "QA-RH-DATA-CANDIDATE-024 C rechaza estado fuera del dominio",
      async () => {
        await attemptInvalidCreate({
          label: "C_INVALID_STATE",
          email:
            "qa-rh-data-024-c@hotel.test",
          expected:
            "ReservaHabitacion.create debe rechazar estado='inventada' y PostgreSQL no debe persistir la fila",
          values: {
            estado:
              "inventada",
          },
        });
      }
    );

    it(
      "QA-RH-DATA-CANDIDATE-024 D rechaza numero_huespedes cero",
      async () => {
        await attemptInvalidCreate({
          label: "D_ZERO_GUESTS",
          email:
            "qa-rh-data-024-d@hotel.test",
          expected:
            "ReservaHabitacion.create debe rechazar numero_huespedes=0 y PostgreSQL no debe persistir la fila",
          values: {
            numero_huespedes:
              0,
          },
        });
      }
    );
  }
);
