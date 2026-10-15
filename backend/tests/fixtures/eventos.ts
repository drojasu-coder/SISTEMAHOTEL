import {
  createSucursal,
} from "./hotel";

const db =
  require("../../src/models");

const {
  Salon,
  ReservaEvento,
} = db;

let sequence = 0;

interface CreateSalonEventoOptions {
  sucursal_id?: number;
  sucursal_activa?: boolean;
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_base?: number;
  descripcion?: string | null;
}

export const createSalonEvento =
  async (
    options:
      CreateSalonEventoOptions = {}
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

      if (
        options.sucursal_activa !==
        undefined
      ) {
        await sucursal.update({
          activa:
            options.sucursal_activa,
        });
      }

      sucursalId =
        sucursal.id;
    }

    return Salon.create({
      sucursal_id:
        sucursalId,

      nombre:
        options.nombre ??
        `Salon QA ${sequence}`,

      capacidad_maxima:
        options.capacidad_maxima ??
        100,

      tarifa_base:
        options.tarifa_base ??
        5000,

      descripcion:
        options.descripcion ??
        "Salón generado para QA",
    });
  };

interface CreateReservaEventoFixtureOptions {
  usuario_id: number;
  salon_id: number;
  tipo_evento?:
    | "boda"
    | "cumpleanos"
    | "ejecutivo"
    | "convivio";
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  numero_invitados?: number;
  estado?: string;
  total?: number;
  anticipo?: number;
}

export const createReservaEventoFixture =
  async (
    options:
      CreateReservaEventoFixtureOptions
  ) => {
    return ReservaEvento.create({
      usuario_id:
        options.usuario_id,

      salon_id:
        options.salon_id,

      tipo_evento:
        options.tipo_evento ??
        "boda",

      fecha:
        options.fecha ??
        "2027-06-10",

      hora_inicio:
        options.hora_inicio ??
        "10:00:00",

      hora_fin:
        options.hora_fin ??
        "12:00:00",

      numero_invitados:
        options.numero_invitados ??
        50,

      estado:
        options.estado ??
        "cotizacion",

      total:
        options.total ??
        5000,

      anticipo:
        options.anticipo ??
        1000,
    });
  };