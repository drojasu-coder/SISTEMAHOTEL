import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { sequelize, Instructor, ReservaActividad } = db;

interface CreateInstructorData {
  nombre: string;
  especialidad?: string;
  activo?: boolean;
}

interface UpdateInstructorData {
  nombre?: string;
  especialidad?: string;
  activo?: boolean;
}

const getCurrentHotelDateTime = () => {
  const timeZone =
    process.env.APP_TIMEZONE ||
    "America/Guatemala";

  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }
  ).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    fecha: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    hora: `${getPart("hour")}:${getPart("minute")}:${getPart("second")}`,
  };
};

export const getAll = async () => {
  return await Instructor.findAll({ order: [["nombre", "ASC"]] });
};

export const getById = async (id: number) => {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) {
    throw new AppError(404, "INSTRUCTOR_NOT_FOUND", "El instructor solicitado no existe");
  }
  return instructor;
};

export const create = async (data: CreateInstructorData) => {
  return await Instructor.create({
    nombre: data.nombre,
    especialidad: data.especialidad,
    activo: data.activo !== undefined ? data.activo : true,
  });
};

export const update = async (id: number, data: UpdateInstructorData) => {
  return sequelize.transaction(async (transaction: any) => {
    const instructor = await Instructor.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!instructor) {
      throw new AppError(404, "INSTRUCTOR_NOT_FOUND", "El instructor solicitado no existe");
    }

    if (instructor.activo && data.activo === false) {
      const current = getCurrentHotelDateTime();
      const futureReservation = await ReservaActividad.findOne({
        attributes: ["id"],
        where: {
          instructor_id: id,
          estado: "confirmada",
          [Op.or]: [
            {
              fecha: {
                [Op.gt]: current.fecha,
              },
            },
            {
              fecha: current.fecha,
              hora_fin: {
                [Op.gt]: current.hora,
              },
            },
          ],
        },
        transaction,
      });

      if (futureReservation) {
        throw new AppError(
          409,
          "INSTRUCTOR_HAS_FUTURE_RESERVATIONS",
          "El instructor tiene reservas futuras confirmadas y no puede desactivarse"
        );
      }
    }

    await instructor.update(data, { transaction });
    return instructor;
  });
};

export const remove = async (id: number) => {
  const instructor = await getById(id);

  const usos = await ReservaActividad.count({ where: { instructor_id: id } });
  if (usos > 0) {
    throw new AppError(409, "INSTRUCTOR_IN_USE", "El instructor tiene citas y no puede eliminarse");
  }

  await instructor.destroy();
};
