import { AppError } from "../../utils/AppError";
const db = require("../../models");
const { Op } = require("sequelize"); // Importamos los operadores de Sequelize

const { ReservaActividad, RecursoActividad, Instructor, Usuario } = db;

interface CreateReservaActividadData {
  usuario_id: number;
  recurso_id: number;
  instructor_id?: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  con_equipo?: boolean;
}

interface UpdateReservaActividadData {
  estado?: string;
  con_equipo?: boolean;
}

export const getAll = async () => {
  return await ReservaActividad.findAll({
    include: [
      { model: RecursoActividad, attributes: ['tipo', 'nombre'] },
      { model: Instructor, attributes: ['nombre'] },
      { model: Usuario, attributes: ['nombre', 'email'] }
    ],
    order: [["fecha", "DESC"], ["hora_inicio", "DESC"]],
  });
};

export const getById = async (id: number) => {
  const reserva = await ReservaActividad.findByPk(id);
  if (!reserva) {
    throw new AppError(404, "RESERVATION_NOT_FOUND", "La reserva solicitada no existe");
  }
  return reserva;
};

export const create = async (data: CreateReservaActividadData) => {
  // 1. Validar que la hora de inicio sea menor a la de fin
  if (data.hora_inicio >= data.hora_fin) {
    throw new AppError(400, "INVALID_TIME_RANGE", "La hora de inicio debe ser anterior a la hora de fin");
  }

  // 2. Validar que el recurso exista
  const recurso = await RecursoActividad.findByPk(data.recurso_id);
  if (!recurso) throw new AppError(404, "RESOURCE_NOT_FOUND", "El recurso solicitado no existe");

  // 3. REGLA DERCAS: Validar traslape del RECURSO (Cancha, Mesa)
  // Fórmula de traslape: (Inicio_Existente < Fin_Nuevo) Y (Fin_Existente > Inicio_Nuevo)
  const traslapeRecurso = await ReservaActividad.findOne({
    where: {
      recurso_id: data.recurso_id,
      fecha: data.fecha,
      estado: 'confirmada',
      [Op.and]: [
        { hora_inicio: { [Op.lt]: data.hora_fin } },
        { hora_fin: { [Op.gt]: data.hora_inicio } }
      ]
    }
  });

  if (traslapeRecurso) {
    throw new AppError(409, "RESOURCE_OVERLAP", "El recurso ya está ocupado en ese horario. Por favor elija otro horario.");
  }

  // 4. REGLA DERCAS: Validar traslape del INSTRUCTOR (Si el cliente pidió uno)
  if (data.instructor_id) {
    const instructor = await Instructor.findByPk(data.instructor_id);
    if (!instructor) throw new AppError(404, "INSTRUCTOR_NOT_FOUND", "El instructor solicitado no existe");

    const traslapeInstructor = await ReservaActividad.findOne({
      where: {
        instructor_id: data.instructor_id,
        fecha: data.fecha,
        estado: 'confirmada',
        [Op.and]: [
          { hora_inicio: { [Op.lt]: data.hora_fin } },
          { hora_fin: { [Op.gt]: data.hora_inicio } }
        ]
      }
    });

    if (traslapeInstructor) {
      throw new AppError(409, "INSTRUCTOR_OVERLAP", "El instructor ya tiene una clase en ese horario.");
    }
  }

  // 5. Si pasa todas las validaciones, creamos la reserva
  const reserva = await ReservaActividad.create({
    usuario_id: data.usuario_id,
    recurso_id: data.recurso_id,
    instructor_id: data.instructor_id || null,
    fecha: data.fecha,
    hora_inicio: data.hora_inicio,
    hora_fin: data.hora_fin,
    con_equipo: data.con_equipo || false,
    estado: 'confirmada'
  });

  return reserva;
};

export const update = async (id: number, data: UpdateReservaActividadData) => {
  const reserva = await getById(id);
  await reserva.update(data);
  return reserva;
};