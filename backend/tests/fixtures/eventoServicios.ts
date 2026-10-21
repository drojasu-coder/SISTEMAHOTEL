const db =
  require("../../src/models");

const {
  ServicioEvento,
  ReservaEventoServicio,
} = db;

let sequence = 0;

interface CreateServicioEventoOptions {
  nombre?: string;
  precio?: number;
}

export const createServicioEvento =
  async (
    options:
      CreateServicioEventoOptions = {}
  ) => {
    sequence += 1;

    return ServicioEvento.create({
      nombre:
        options.nombre ??
        `Servicio Evento QA ${sequence}`,

      precio:
        options.precio ??
        300,
    });
  };

interface CreateReservaEventoServicioOptions {
  reserva_evento_id: number;
  servicio_evento_id: number;
  cantidad?: number;
  subtotal?: number;
}

export const createReservaEventoServicioFixture =
  async (
    options:
      CreateReservaEventoServicioOptions
  ) => {
    return ReservaEventoServicio.create({
      reserva_evento_id:
        options.reserva_evento_id,

      servicio_evento_id:
        options.servicio_evento_id,

      cantidad:
        options.cantidad ??
        1,

      subtotal:
        options.subtotal ??
        300,
    });
  };