const db =
  require("../../src/models");

const {
  Sucursal,
  TipoHabitacion,
  Habitacion,
  Parqueo,
} = db;



let sequence = 0;

interface CreateSucursalOptions {
  nombre?: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  activa?: boolean;
}

interface CreateTipoHabitacionOptions {
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_noche?: number;
  descripcion?: string | null;
}

interface CreateHabitacionOptions {
  sucursal_id: number;
  tipo_habitacion_id: number;
  numero?: string;
  estado?: string;
}

export const createSucursal =
  async (
    options:
      CreateSucursalOptions = {}
  ) => {
    sequence += 1;

    return Sucursal.create({
      nombre:
        options.nombre ??
        `Sucursal QA ${sequence}`,

      direccion:
        options.direccion ??
        "Zona QA",

      ciudad:
        options.ciudad ??
        "Guatemala",

      telefono:
        options.telefono ??
        "55550000",

      activa:
        options.activa ??
        true,
    });
  };

export const createTipoHabitacion =
  async (
    options:
      CreateTipoHabitacionOptions = {}
  ) => {
    sequence += 1;

    return TipoHabitacion.create({
      nombre:
        options.nombre ??
        `Tipo QA ${sequence}`,

      capacidad_maxima:
        options.capacidad_maxima ??
        4,

      tarifa_noche:
        options.tarifa_noche ??
        100,

      descripcion:
        options.descripcion ??
        "Habitación creada para QA",
    });
  };

export const createHabitacion =
  async (
    options:
      CreateHabitacionOptions
  ) => {
    sequence += 1;

    return Habitacion.create({
      sucursal_id:
        options.sucursal_id,

      tipo_habitacion_id:
        options.tipo_habitacion_id,

      numero:
        options.numero ??
        `QA-${sequence}`,

      estado:
        options.estado ??
        "disponible",
    });
  };

interface CreateHotelFixtureOptions {
  capacidad?: number;
  tarifa?: number;
  estadoHabitacion?: string;
}

export const createHotelFixture =
  async (
    options:
      CreateHotelFixtureOptions = {}
  ) => {
    const sucursal =
      await createSucursal();

    const tipoHabitacion =
      await createTipoHabitacion({
        capacidad_maxima:
          options.capacidad ??
          4,

        tarifa_noche:
          options.tarifa ??
          100,
      });

    const habitacion =
      await createHabitacion({
        sucursal_id:
          sucursal.id,

        tipo_habitacion_id:
          tipoHabitacion.id,

        estado:
          options.estadoHabitacion ??
          "disponible",
      });

    return {
      sucursal,
      tipoHabitacion,
      habitacion,
    };
  };

  interface CreateParqueoOptions {
  sucursal_id?: number;
  numero?: string;
  estado?: string;
}

export const createParqueo =
  async (
    options:
      CreateParqueoOptions = {}
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

    return Parqueo.create({
      sucursal_id:
        sucursalId,

      numero:
        options.numero ??
        `P-QA-${sequence}`,

      estado:
        options.estado ??
        "disponible",
    });
  };