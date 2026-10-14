import {
  createSucursal,
} from "./hotel";

const db =
  require("../../src/models");

const {
  Amenidad,
  ReservaAmenidad,
} = db;

let sequence = 0;

interface CreateAmenidadOptions {
  sucursal_id?: number;
  nombre?: string;
  aforo_maximo?: number;
}

export const createAmenidad =
  async (
    options:
      CreateAmenidadOptions = {}
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

    return Amenidad.create({
      sucursal_id:
        sucursalId,

      nombre:
        options.nombre ??
        `Amenidad QA ${sequence}`,

      aforo_maximo:
        options.aforo_maximo ??
        5,
    });
  };

interface CreateReservaAmenidadFixtureOptions {
  usuario_id: number;
  amenidad_id: number;
  fecha?: string;
  franja_horaria?: string;
  mobiliario?: string | null;
  codigo_qr?: string | null;
  estado?:
    | "confirmada"
    | "cancelada"
    | "usada";
}

export const createReservaAmenidadFixture =
  async (
    options:
      CreateReservaAmenidadFixtureOptions
  ) => {
    sequence += 1;

    return ReservaAmenidad.create({
      usuario_id:
        options.usuario_id,

      amenidad_id:
        options.amenidad_id,

      fecha:
        options.fecha ??
        "2027-06-10",

      franja_horaria:
        options.franja_horaria ??
        "10:00-11:00",

      mobiliario:
        options.mobiliario ??
        "ninguno",

      codigo_qr:
        options.codigo_qr ??
        `QA-QR-${sequence}`,

      estado:
        options.estado ??
        "confirmada",
    });
  };