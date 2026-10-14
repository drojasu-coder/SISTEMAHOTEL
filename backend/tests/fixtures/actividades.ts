import {
  createSucursal,
} from "./hotel";

const db =
  require("../../src/models");

const {
  RecursoActividad,
  Instructor,
  ReservaActividad,
} = db;

let sequence = 0;

interface CreateRecursoActividadOptions {
  sucursal_id?: number;
  tipo?: string;
  nombre?: string;
}

export const createRecursoActividad =
  async (
    options:
      CreateRecursoActividadOptions = {}
  ) => {
    sequence += 1;

    let sucursalId =
      options.sucursal_id;

    if (
      sucursalId ===
      undefined
    ) {
      const sucursal =
        await createSucursal();

      sucursalId =
        sucursal.id;
    }

    return RecursoActividad.create({
      sucursal_id:
        sucursalId,

      tipo:
        options.tipo ??
        "cancha",

      nombre:
        options.nombre ??
        `Recurso QA ${sequence}`,
    });
  };

interface CreateInstructorOptions {
  nombre?: string;
  especialidad?: string | null;
  activo?: boolean;
}

export const createInstructor =
  async (
    options:
      CreateInstructorOptions = {}
  ) => {
    sequence += 1;

    return Instructor.create({
      nombre:
        options.nombre ??
        `Instructor QA ${sequence}`,

      especialidad:
        options.especialidad ??
        "Actividad física",

      activo:
        options.activo ??
        true,
    });
  };

interface CreateReservaActividadFixtureOptions {
  usuario_id: number;
  recurso_id: number;
  instructor_id?: number | null;
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  con_equipo?: boolean;
  estado?:
    | "confirmada"
    | "cancelada"
    | "completada";
}

export const createReservaActividadFixture =
  async (
    options:
      CreateReservaActividadFixtureOptions
  ) => {
    return ReservaActividad.create({
      usuario_id:
        options.usuario_id,

      recurso_id:
        options.recurso_id,

      instructor_id:
        options.instructor_id ??
        null,

      fecha:
        options.fecha ??
        "2027-06-10",

      hora_inicio:
        options.hora_inicio ??
        "10:00:00",

      hora_fin:
        options.hora_fin ??
        "11:00:00",

      con_equipo:
        options.con_equipo ??
        false,

      estado:
        options.estado ??
        "confirmada",
    });
  };