import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createRecursoActividad,
} from "../fixtures/actividades";

import {
  createTestUser,
} from "../fixtures/users";

const db =
  require("../../src/models");

const {
  ReservaActividad,
} = db;

describe(
  "Integridad persistida de ReservaActividad",
  () => {
    it(
      "QA-RA-DATA-CANDIDATE-006 STATE rechaza un estado fuera del dominio",
      async () => {
        const {
          usuario,
        } = await createTestUser({
          email:
            "qa-ra-integrity-state@hotel.test",
        });

        const recurso =
          await createRecursoActividad({
            nombre:
              "QA RA integrity STATE",
          });

        const criteria = {
          usuario_id:
            usuario.id,
          recurso_id:
            recurso.id,
          fecha:
            "2031-01-11",
        };

        let accepted = false;
        let error:
          unknown = null;

        try {
          await ReservaActividad.create({
            ...criteria,
            instructor_id:
              null,
            hora_inicio:
              "09:00:00",
            hora_fin:
              "10:00:00",
            con_equipo:
              false,
            total:
              "0.00",
            estado:
              "inventada",
          } as any);

          accepted = true;
        } catch (
          caughtError
        ) {
          error =
            caughtError;
        }

        const persistedRows =
          await ReservaActividad.findAll({
            where:
              criteria,
          });

        console.log(
          "[QA-RA-DATA-CANDIDATE-006][STATE]",
          {
            accepted,
            rejected:
              !accepted,
            errorName:
              error instanceof Error
                ? error.name
                : null,
            errorMessage:
              error instanceof Error
                ? error.message
                : null,
            persistedCount:
              persistedRows.length,
            persistedRow:
              persistedRows[0]?.toJSON() ??
              null,
          }
        );

        expect(
          accepted,
          "ReservaActividad.create debe rechazar estado='inventada'"
        ).toBe(false);

        expect(
          persistedRows.length,
          "No debe persistirse una reserva con estado fuera del dominio"
        ).toBe(0);
      }
    );

    it(
      "QA-RA-DATA-CANDIDATE-006 TIME rechaza hora_inicio posterior a hora_fin",
      async () => {
        const {
          usuario,
        } = await createTestUser({
          email:
            "qa-ra-integrity-time@hotel.test",
        });

        const recurso =
          await createRecursoActividad({
            nombre:
              "QA RA integrity TIME",
          });

        const criteria = {
          usuario_id:
            usuario.id,
          recurso_id:
            recurso.id,
          fecha:
            "2031-02-12",
        };

        let accepted = false;
        let error:
          unknown = null;

        try {
          await ReservaActividad.create({
            ...criteria,
            instructor_id:
              null,
            hora_inicio:
              "12:00:00",
            hora_fin:
              "10:00:00",
            con_equipo:
              false,
            total:
              "0.00",
            estado:
              "confirmada",
          });

          accepted = true;
        } catch (
          caughtError
        ) {
          error =
            caughtError;
        }

        const persistedRows =
          await ReservaActividad.findAll({
            where:
              criteria,
          });

        console.log(
          "[QA-RA-DATA-CANDIDATE-006][TIME]",
          {
            accepted,
            rejected:
              !accepted,
            errorName:
              error instanceof Error
                ? error.name
                : null,
            errorMessage:
              error instanceof Error
                ? error.message
                : null,
            persistedCount:
              persistedRows.length,
            persistedRow:
              persistedRows[0]?.toJSON() ??
              null,
          }
        );

        expect(
          accepted,
          "ReservaActividad.create debe rechazar 12:00:00 -> 10:00:00"
        ).toBe(false);

        expect(
          persistedRows.length,
          "No debe persistirse una reserva con rango horario invertido"
        ).toBe(0);
      }
    );

    it(
      "QA-RA-DATA-CANDIDATE-006 TOTAL rechaza un total negativo",
      async () => {
        const {
          usuario,
        } = await createTestUser({
          email:
            "qa-ra-integrity-total@hotel.test",
        });

        const recurso =
          await createRecursoActividad({
            nombre:
              "QA RA integrity TOTAL",
          });

        const criteria = {
          usuario_id:
            usuario.id,
          recurso_id:
            recurso.id,
          fecha:
            "2031-03-13",
        };

        let accepted = false;
        let error:
          unknown = null;

        try {
          await ReservaActividad.create({
            ...criteria,
            instructor_id:
              null,
            hora_inicio:
              "14:00:00",
            hora_fin:
              "15:00:00",
            con_equipo:
              false,
            total:
              "-1.00",
            estado:
              "confirmada",
          });

          accepted = true;
        } catch (
          caughtError
        ) {
          error =
            caughtError;
        }

        const persistedRows =
          await ReservaActividad.findAll({
            where:
              criteria,
          });

        console.log(
          "[QA-RA-DATA-CANDIDATE-006][TOTAL]",
          {
            accepted,
            rejected:
              !accepted,
            errorName:
              error instanceof Error
                ? error.name
                : null,
            errorMessage:
              error instanceof Error
                ? error.message
                : null,
            persistedCount:
              persistedRows.length,
            persistedRow:
              persistedRows[0]?.toJSON() ??
              null,
          }
        );

        expect(
          accepted,
          "ReservaActividad.create debe rechazar total=-1.00"
        ).toBe(false);

        expect(
          persistedRows.length,
          "No debe persistirse una reserva con total negativo"
        ).toBe(0);
      }
    );
  }
);
