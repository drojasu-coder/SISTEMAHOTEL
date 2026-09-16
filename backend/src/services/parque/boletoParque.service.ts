import {
  randomUUID,
} from "crypto";

import {
  AppError,
} from "../../utils/AppError";

import {
  env,
} from "../../config/env";

const db =
  require("../../models");

const {
  BoletoParque,
  Usuario,
} = db;

// ======================================================
// PRECIO SEGÚN TIPO DE BOLETO
// ======================================================

const getTicketPrice = (
  tipoBoleto: string
) => {
  switch (tipoBoleto) {
    case "adulto":
      return env
        .PARK_TICKET_PRICE_ADULT;

    case "nino":
      return env
        .PARK_TICKET_PRICE_CHILD;

    case "familiar":
      return env
        .PARK_TICKET_PRICE_FAMILY;

    default:
      throw new AppError(
        400,
        "INVALID_TICKET_TYPE",
        "El tipo de boleto no es válido"
      );
  }
};

// ======================================================
// VALIDAR FECHA
// ======================================================

const validateVisitDate = (
  fechaVisita: string
) => {
  const hoy =
    new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  const fecha =
    new Date(
      `${fechaVisita}T00:00:00`
    );

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    throw new AppError(
      400,
      "INVALID_VISIT_DATE",
      "La fecha de visita no es válida"
    );
  }

  if (
    fecha < hoy
  ) {
    throw new AppError(
      422,
      "VISIT_DATE_IN_PAST",
      "La fecha de visita no puede estar en el pasado"
    );
  }
};

// ======================================================
// LISTAR
// ======================================================

export const getAll =
  async () => {
    return BoletoParque.findAll({
      include: [
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
        [
          "fecha_visita",
          "DESC",
        ],
      ],
    });
  };

// ======================================================
// OBTENER POR ID
// ======================================================

export const getById =
  async (
    id: number
  ) => {
    const boleto =
      await BoletoParque.findByPk(
        id,
        {
          include: [
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

    if (!boleto) {
      throw new AppError(
        404,
        "TICKET_NOT_FOUND",
        "El boleto de parque solicitado no existe"
      );
    }

    return boleto;
  };

// ======================================================
// CREAR
// ======================================================

export const create =
  async (
    data: {
      usuario_id: number;
      tipo_boleto:
        | "adulto"
        | "nino"
        | "familiar";
      fecha_visita: string;
    }
  ) => {
    validateVisitDate(
      data.fecha_visita
    );

    /*
     * El precio SIEMPRE lo decide
     * el backend.
     */
    const precio =
      getTicketPrice(
        data.tipo_boleto
      );

    /*
     * UUID aleatorio en lugar de un
     * código predecible basado en timestamp.
     */
    const codigoQr =
      `PARK-${randomUUID()}`;

    const boleto =
      await BoletoParque.create({
        usuario_id:
          data.usuario_id,

        tipo_boleto:
          data.tipo_boleto,

        precio,

        fecha_visita:
          data.fecha_visita,

        codigo_qr:
          codigoQr,

        estado:
          "valido",
      });

    return boleto;
  };

// ======================================================
// ACTUALIZAR ESTADO
// ======================================================

export const updateStatus =
  async (
    id: number,
    estado:
      | "valido"
      | "usado"
      | "cancelado"
  ) => {
    const boleto =
      await BoletoParque.findByPk(
        id
      );

    if (!boleto) {
      throw new AppError(
        404,
        "TICKET_NOT_FOUND",
        "El boleto de parque solicitado no existe"
      );
    }

    if (
      boleto.estado ===
      estado
    ) {
      throw new AppError(
        409,
        "TICKET_STATUS_UNCHANGED",
        `El boleto ya se encuentra en estado ${estado}`
      );
    }

    if (
      boleto.estado ===
        "usado" ||
      boleto.estado ===
        "cancelado"
    ) {
      throw new AppError(
        409,
        "TICKET_STATUS_FINAL",
        "El boleto se encuentra en un estado final y ya no puede modificarse"
      );
    }

    await boleto.update({
      estado,
    });

    return boleto;
  };

// ======================================================
// ELIMINAR
// ======================================================

export const remove =
  async (
    id: number
  ) => {
    const boleto =
      await BoletoParque.findByPk(
        id
      );

    if (!boleto) {
      throw new AppError(
        404,
        "TICKET_NOT_FOUND",
        "El boleto de parque solicitado no existe"
      );
    }

    await boleto.destroy();
  };