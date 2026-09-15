import { AppError } from "../../utils/AppError";
const db = require("../../models");
const { Op } = require("sequelize");

const {
  CitaBienestar,
  Terapeuta,
  ServicioBienestar,
  Usuario,
} = db;

export const getAll = async () => {
  return await CitaBienestar.findAll({
    include: [
      { model: Terapeuta, attributes: ['nombre', 'activo'] },
      { model: ServicioBienestar, attributes: ['nombre', 'duracion_minutos', 'precio'] },
      { model: Usuario, attributes: ['nombre', 'email'] }
    ],
    order: [["fecha", "DESC"], ["hora_inicio", "DESC"]],
  });
};

export const getById = async (id: number) => {
  const cita = await CitaBienestar.findByPk(id);
  if (!cita) throw new AppError(404, "APPOINTMENT_NOT_FOUND", "La cita de spa no existe");
  return cita;
};

// Función auxiliar para convertir "HH:MM:SS" a minutos totales desde medianoche
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Función auxiliar para convertir minutos totales de vuelta a "HH:MM:SS"
const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

export const create = async (data: any) => {
  // 1. Validar que el terapeuta y el servicio existan
  const terapeuta = await Terapeuta.findByPk(data.terapeuta_id);
  if (!terapeuta) throw new AppError(404, "THERAPIST_NOT_FOUND", "El terapeuta no existe");

  const servicio =
  await ServicioBienestar.findByPk(
    data.servicio_bienestar_id
  );
  if (!servicio) throw new AppError(404, "SPA_SERVICE_NOT_FOUND", "El servicio de spa no existe");

  // 2. Calcular hora de fin basándonos en la duración del servicio
  const inicioMinutos = timeToMinutes(data.hora_inicio);
  const finServicioMinutos = inicioMinutos + servicio.duracion_minutos;
  
  // REGLA DERCAS: Buffer de descanso obligatorio de 15 minutos para el terapeuta
  const BUFFER_MINUTOS = 15;
  const finConBufferMinutos = finServicioMinutos + BUFFER_MINUTOS;

  const horaFinCalculada = minutesToTime(finServicioMinutos);
  const horaFinConBuffer = minutesToTime(finConBufferMinutos);

  // 3. Validar traslape considerando el buffer de descanso del terapeuta
  const traslape =
  await CitaBienestar.findOne({
    where: {
      terapeuta_id: data.terapeuta_id,
      fecha: data.fecha,
      estado: 'confirmada',
      [Op.and]: [
        { hora_inicio: { [Op.lt]: horaFinConBuffer } },
        { hora_fin: { [Op.gt]: data.hora_inicio } }
      ]
    }
  });

  if (traslape) {
    throw new AppError(
      409, 
      "THERAPIST_BUSY_OR_BUFFER", 
      "El terapeuta no está disponible en este horario. Se requiere un tiempo de descanso entre citas."
    );
  }

  // 4. Crear la cita
  const cita = await CitaBienestar.create({
    usuario_id: data.usuario_id,
    terapeuta_id: data.terapeuta_id,
    servicio_bienestar_id:
  data.servicio_bienestar_id,
    fecha: data.fecha,
    hora_inicio: data.hora_inicio,
    hora_fin: horaFinCalculada,
    estado: 'confirmada'

  });

  if (!terapeuta.activo) {
  throw new AppError(
    422,
    "THERAPIST_INACTIVE",
    "El terapeuta seleccionado se encuentra inactivo"
  );
}

  return cita;
};

export const updateStatus = async (id: number, data: any) => {
  const cita = await getById(id);
  await cita.update(data);
  return cita;
};