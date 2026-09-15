import { AppError } from "../../utils/AppError";
const db = require("../../models");
const { Op } = require("sequelize");

const { ReservaMesa, Mesa, Usuario } = db;

export const getAll = async () => {
  return await ReservaMesa.findAll({
    include: [
      { model: Mesa, attributes: ['zona', 'capacidad'] },
      { model: Usuario, attributes: ['nombre', 'email'] }
    ],
    order: [["fecha", "DESC"], ["hora_inicio", "DESC"]],
  });
};

export const getById = async (id: number) => {
  const reserva = await ReservaMesa.findByPk(id);
  if (!reserva) throw new AppError(404, "RESERVATION_NOT_FOUND", "La reserva de mesa no existe");
  return reserva;
};

export const create = async (data: any) => {
  if (data.hora_inicio >= data.hora_fin) {
    throw new AppError(400, "INVALID_TIME", "La hora de inicio debe ser menor a la hora de fin");
  }

  const mesa = await Mesa.findByPk(data.mesa_id);
  if (!mesa) throw new AppError(404, "TABLE_NOT_FOUND", "La mesa solicitada no existe");

  // Validar que la mesa tenga la capacidad suficiente para las personas
  if (data.cantidad_personas > mesa.capacidad) {
    throw new AppError(400, "CAPACITY_EXCEEDED", `La mesa seleccionada solo tiene capacidad para ${mesa.capacidad} personas`);
  }

  // Validar traslape: Que nadie más tenga la mesa en ese rango de horas
  const traslape = await ReservaMesa.findOne({
    where: {
      mesa_id: data.mesa_id,
      fecha: data.fecha,
      estado: 'confirmada',
      [Op.and]: [
        { hora_inicio: { [Op.lt]: data.hora_fin } },
        { hora_fin: { [Op.gt]: data.hora_inicio } }
      ]
    }
  });

  if (traslape) {
    throw new AppError(409, "TABLE_UNAVAILABLE", "La mesa ya se encuentra reservada en ese horario");
  }

  const reserva = await ReservaMesa.create({
    usuario_id: data.usuario_id,
    mesa_id: data.mesa_id,
    fecha: data.fecha,
    hora_inicio: data.hora_inicio,
    hora_fin: data.hora_fin,
    cantidad_personas: data.cantidad_personas,
    estado: 'confirmada'
  });

  return reserva;
};

export const updateStatus = async (id: number, data: any) => {
  const reserva = await getById(id);
  await reserva.update(data);
  return reserva;
};