const db = require("../../models");

const {
  ReservaHabitacion,
  ReservaEvento,
  BoletoParque,
  CitaBienestar,
  ServicioBienestar,
} = db;

export interface ModuloPagoConfig {
  model: any;
  buscarRegistro: (itemId: number) => Promise<any | null>;
  obtenerMonto: (registro: any) => number;
  campoEstado: string;
  estadosValidosParaCobrar: string[];
  estadoTrasPago: string;
}

export const MODULOS_PAGO: Record<string, ModuloPagoConfig> = {
  reserva_habitacion: {
    model: ReservaHabitacion,
    buscarRegistro: (itemId) => ReservaHabitacion.findByPk(itemId),
    obtenerMonto: (registro) => Number(registro.total),
    campoEstado: "estado",
    estadosValidosParaCobrar: ["pendiente"],
    estadoTrasPago: "confirmada",
  },

  reserva_evento: {
    model: ReservaEvento,
    buscarRegistro: (itemId) => ReservaEvento.findByPk(itemId),
    obtenerMonto: (registro) => Number(registro.anticipo), // o .total — confirma cuál quieres cobrar
    campoEstado: "estado",
    estadosValidosParaCobrar: ["cotizacion"],
    estadoTrasPago: "confirmado",
  },

  boleto_parque: {
    model: BoletoParque,
    buscarRegistro: (itemId) => BoletoParque.findByPk(itemId),
    obtenerMonto: (registro) => Number(registro.precio),
    campoEstado: "estado",
    estadosValidosParaCobrar: ["valido"],
    estadoTrasPago: "valido",
  },

  cita_bienestar: {
    model: CitaBienestar,
    buscarRegistro: (itemId) =>
      CitaBienestar.findByPk(itemId, {
        include: [{ model: ServicioBienestar }], // sin alias -> key = "ServicioBienestar"
      }),
    obtenerMonto: (registro) => Number(registro.ServicioBienestar.precio),
    campoEstado: "estado",
    estadosValidosParaCobrar: ["confirmada"],
    estadoTrasPago: "confirmada",
  },
};

export type TipoModuloPago = keyof typeof MODULOS_PAGO;