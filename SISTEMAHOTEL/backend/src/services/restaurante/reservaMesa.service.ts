import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  ReservaMesa,
  Mesa,
  Usuario,
} = db;

const validateReservationDate = (
  fecha: string
) => {
  const hoy = new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  const fechaReserva =
    new Date(
      `${fecha}T00:00:00`
    );

  if (fechaReserva < hoy) {
    throw new AppError(
      422,
      "TABLE_RESERVATION_DATE_IN_PAST",
      "La fecha de la reserva no puede estar en el pasado"
    );
  }
};

export const getAll = async () => {
  return ReservaMesa.findAll({
    include: [
      {
        model: Mesa,
        attributes: [
          "id",
          "zona",
          "capacidad",
          "estado",
        ],
      },
      {
        model: Usuario,
        attributes: [
          "id",
          "nombre",
          "email",
        ],
      },
    ],

    order: [
      ["fecha", "DESC"],
      ["hora", "DESC"],
    ],
  });
};

export const getById = async (
  id: number
) => {
  const reserva =
    await ReservaMesa.findByPk(
      id,
      {
        include: [
          {
            model: Mesa,
            attributes: [
              "id",
              "zona",
              "capacidad",
              "estado",
            ],
          },
          {
            model: Usuario,
            attributes: [
              "id",
              "nombre",
              "email",
            ],
          },
        ],
      }
    );

  if (!reserva) {
    throw new AppError(
      404,
      "TABLE_RESERVATION_NOT_FOUND",
      "La reserva de mesa solicitada no existe"
    );
  }

  return reserva;
};

export const create = async (
  data: {
    usuario_id: number;
    mesa_id: number;
    fecha: string;
    hora: string;
    numero_comensales: number;
  }
) => {
  validateReservationDate(
    data.fecha
  );

  const mesa =
    await Mesa.findByPk(
      data.mesa_id
    );

  if (!mesa) {
    throw new AppError(
      404,
      "TABLE_NOT_FOUND",
      "La mesa solicitada no existe"
    );
  }

  if (
    data.numero_comensales >
    mesa.capacidad
  ) {
    throw new AppError(
      422,
      "TABLE_CAPACITY_EXCEEDED",
      `La mesa seleccionada solo tiene capacidad para ${mesa.capacidad} personas`
    );
  }

  /*
   * El modelo actual solamente almacena una hora,
   * no hora_inicio/hora_fin.
   *
   * Por ello impedimos dos reservas confirmadas
   * para la misma mesa + fecha + hora.
   */
  const existente =
    await ReservaMesa.findOne({
      where: {
        mesa_id:
          data.mesa_id,

        fecha:
          data.fecha,

        hora:
          data.hora,

        estado:
          "confirmada",
      },
    });

  if (existente) {
    throw new AppError(
      409,
      "TABLE_UNAVAILABLE",
      "La mesa ya se encuentra reservada para esa fecha y hora"
    );
  }

  const reserva =
    await ReservaMesa.create({
      usuario_id:
        data.usuario_id,

      mesa_id:
        data.mesa_id,

      fecha:
        data.fecha,

      hora:
        data.hora,

      numero_comensales:
        data.numero_comensales,

      estado:
        "confirmada",
    });

  return getById(
    reserva.id
  );
};

export const updateStatus = async (
  id: number,
  estado: "confirmada" | "cancelada"
) => {
  const reserva =
    await ReservaMesa.findByPk(id);

  if (!reserva) {
    throw new AppError(
      404,
      "TABLE_RESERVATION_NOT_FOUND",
      "La reserva de mesa solicitada no existe"
    );
  }

  if (
    reserva.estado === estado
  ) {
    throw new AppError(
      409,
      "TABLE_RESERVATION_STATUS_UNCHANGED",
      `La reserva ya se encuentra en estado ${estado}`
    );
  }

  await reserva.update({
    estado,
  });

  return getById(id);
};