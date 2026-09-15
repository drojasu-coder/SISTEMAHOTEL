import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { ReservaAmenidad, Amenidad, Usuario } = db;

interface CreateReservaAmenidadData {
  usuario_id: number;
  amenidad_id: number;
  fecha: string;
  franja_horaria: string;
  mobiliario?: string;
}

interface UpdateReservaAmenidadData {
  estado?: string;
  mobiliario?: string;
}

export const getAll = async () => {
  return await ReservaAmenidad.findAll({
    include: [
      { model: Amenidad, attributes: ['nombre', 'aforo_maximo'] },
      { model: Usuario, attributes: ['nombre', 'email'] }
    ],
    order: [["fecha", "DESC"], ["franja_horaria", "ASC"]],
  });
};

export const getById = async (id: number) => {
  const reserva = await ReservaAmenidad.findByPk(id);
  if (!reserva) {
    throw new AppError(404, "RESERVATION_NOT_FOUND", "La reserva de amenidad no existe");
  }
  return reserva;
};

export const create = async (data: CreateReservaAmenidadData) => {
  const amenidad = await Amenidad.findByPk(data.amenidad_id);
  if (!amenidad) throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");

  // REGLA DERCAS: Validar Aforo Máximo en esa fecha y franja horaria
  const ocupacionActual = await ReservaAmenidad.count({
    where: {
      amenidad_id: data.amenidad_id,
      fecha: data.fecha,
      franja_horaria: data.franja_horaria,
      estado: 'confirmada'
    }
  });

  if (ocupacionActual >= amenidad.aforo_maximo) {
    throw new AppError(
      409, 
      "CAPACITY_FULL", 
      `El aforo máximo de ${amenidad.aforo_maximo} personas ya está lleno para esta franja horaria.`
    );
  }

  // REGLA DERCAS: Generación de Código QR (Creamos un identificador único seguro)
  // El frontend usará este texto para dibujar la imagen del QR
  const qrString = `AMENIDAD-${data.amenidad_id}-USER-${data.usuario_id}-DATE-${Date.now()}`;

  const reserva = await ReservaAmenidad.create({
    usuario_id: data.usuario_id,
    amenidad_id: data.amenidad_id,
    fecha: data.fecha,
    franja_horaria: data.franja_horaria,
    mobiliario: data.mobiliario || 'ninguno',
    codigo_qr: qrString,
    estado: 'confirmada'
  });

  return reserva;
};

export const updateStatus = async (id: number, data: UpdateReservaAmenidadData) => {
  const reserva = await getById(id);
  await reserva.update(data);
  return reserva;
};