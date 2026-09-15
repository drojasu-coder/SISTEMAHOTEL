import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { BoletoParque, Usuario } = db;

export const getAll = async () => {
  return await BoletoParque.findAll({
    include: [{ model: Usuario, attributes: ['nombre', 'email'] }],
    order: [["fecha_visita", "DESC"]],
  });
};

export const getById = async (id: number) => {
  const boleto = await BoletoParque.findByPk(id);
  if (!boleto) {
    throw new AppError(404, "TICKET_NOT_FOUND", "El boleto de parque solicitado no existe");
  }
  return boleto;
};

export const create = async (data: any) => {
  // Generamos un código de barras o identificador único para el boleto físico/digital
const codigoQr =
  `PARK-TICKET-${data.usuario_id}-${Date.now()}`;

const boleto =
  await BoletoParque.create({
    usuario_id:
      data.usuario_id,

    tipo_boleto:
      data.tipo_boleto,

    precio:
      data.precio,

    fecha_visita:
      data.fecha_visita,

    codigo_qr:
      codigoQr,

    estado:
      "valido",
  });

  return boleto;
};

export const updateStatus = async (id: number, data: any) => {
  const boleto = await getById(id);
  await boleto.update(data);
  return boleto;
};

export const remove = async (id: number) => {
  const boleto = await getById(id);
  await boleto.destroy();
};