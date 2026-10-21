import {
  createSucursal,
} from "./hotel";

const db =
  require("../../src/models");

const {
  Mesa,
  ReservaMesa,
} = db;

let sequence = 0;

interface CreateMesaOptions {
  sucursal_id?: number;
  zona?: string;
  capacidad?: number;
  estado?: string;
}

export const createMesa =
  async (
    options:
      CreateMesaOptions = {}
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

    return Mesa.create({
      sucursal_id:
        sucursalId,

      zona:
        options.zona ??
        `Zona QA ${sequence}`,

      capacidad:
        options.capacidad ??
        4,

      estado:
        options.estado ??
        "disponible",
    });
  };

interface CreateReservaMesaFixtureOptions {
  usuario_id: number;
  mesa_id: number;
  fecha?: string;
  hora?: string;
  numero_comensales?: number;
  estado?:
    | "confirmada"
    | "cancelada";
}

/**
 * Fixture directo para preparar estados que
 * serían incómodos de construir exclusivamente
 * mediante HTTP, especialmente en pruebas
 * de reactivación y concurrencia.
 */
export const createReservaMesaFixture =
  async (
    options:
      CreateReservaMesaFixtureOptions
  ) => {
    return ReservaMesa.create({
      usuario_id:
        options.usuario_id,

      mesa_id:
        options.mesa_id,

      fecha:
        options.fecha ??
        "2027-06-10",

      hora:
        options.hora ??
        "10:00:00",

      numero_comensales:
        options.numero_comensales ??
        2,

      estado:
        options.estado ??
        "confirmada",
    });
  };