import crypto from "crypto";
import { AppError } from "../../utils/AppError";
import * as mediaUploadService from "../storage/mediaUpload.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";
import { assertExperienciaCompleta } from "../../validators/actividades/recursoActividad.validator";
import { ahoraEnGuatemala, contarFueraDeHorario, horaDe, iniciosDelDia, leerHorario, minutosDe, validarHorarioConfigurado, INTERVALO_FRANJAS_MINUTOS } from "../../utils/franjasHorarias";

/** Regla existente de las actividades por hora: entre 30 minutos y 2 horas. */
export const DURACION_MINIMA_POR_HORA = 30;
export const DURACION_MAXIMA_POR_HORA = 120;

const db = require("../../models");
const { Op } = require("sequelize");

const { RecursoActividad, Sucursal, ReservaActividad } = db;

interface CreateRecursoData {
  sucursal_id: number;
  tipo: string;
  nombre: string;
  precio_hora?: number;
  precio_equipo?: number;
  precio_instructor_hora?: number;
  imagen_key?: string | null;
  modalidad?: "por_hora" | "experiencia";
  duracion_minutos?: number | null;
  cupo_maximo?: number | null;
  precio_persona?: number | null;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
}

interface UpdateRecursoData {
  tipo?: string;
  nombre?: string;
  precio_hora?: number;
  precio_equipo?: number;
  precio_instructor_hora?: number;
  imagen_key?: string | null;
  modalidad?: "por_hora" | "experiencia";
  duracion_minutos?: number | null;
  cupo_maximo?: number | null;
  precio_persona?: number | null;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
}

const MODALIDAD_KEYS = ["modalidad", "duracion_minutos", "cupo_maximo", "precio_persona"] as const;
const HORARIO_KEYS = ["hora_apertura", "hora_cierre"] as const;
const pickHorario = (data: Partial<CreateRecursoData>) =>
  Object.fromEntries(HORARIO_KEYS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));

/** Duración mínima de una reserva del recurso, para comprobar que cabe en su horario. */
const duracionMinimaRecurso = (recurso: { modalidad?: string; duracion_minutos?: number | null }) =>
  recurso.modalidad === "experiencia" ? Number(recurso.duracion_minutos) || null : DURACION_MINIMA_POR_HORA;

/** Coherencia del horario con los valores resultantes (apertura, cierre y duración). */
const validarHorarioRecurso = (resultante: any) =>
  validarHorarioConfigurado(
    { hora_apertura: resultante.hora_apertura?.slice(0, 5) ?? null, hora_cierre: resultante.hora_cierre?.slice(0, 5) ?? null },
    duracionMinimaRecurso(resultante),
  );

const pickModalidad = (data: Partial<CreateRecursoData>) =>
  Object.fromEntries(MODALIDAD_KEYS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));

export async function serializeRecursoActividad(recurso: any): Promise<any> {
  if (!recurso) return null;
  const plain = typeof recurso.get === "function" ? recurso.get({ plain: true }) : { ...recurso };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

export const getAll = async (where: Record<string | symbol, unknown> = {}) => {
  const recursos = await RecursoActividad.findAll({
    where,
    include: [{ model: Sucursal, attributes: ["id", "nombre"] }],
    order: [["tipo", "ASC"], ["nombre", "ASC"]],
  });
  return Promise.all(recursos.map(serializeRecursoActividad));
};

export const getById = async (id: number) => {
  const recurso = await RecursoActividad.findByPk(id, {
    include: [{ model: Sucursal, attributes: ["id", "nombre"] }],
  });
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  return serializeRecursoActividad(recurso);
};

export const create = async (data: CreateRecursoData) => {
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal indicada no existe");
  }

  validarHorarioRecurso({ modalidad: "por_hora", ...data });
  const created = await RecursoActividad.create({
    sucursal_id: data.sucursal_id,
    tipo: data.tipo,
    nombre: data.nombre,
    ...(data.precio_hora !== undefined && { precio_hora: data.precio_hora }),
    ...(data.precio_equipo !== undefined && { precio_equipo: data.precio_equipo }),
    ...(data.precio_instructor_hora !== undefined && {
      precio_instructor_hora: data.precio_instructor_hora,
    }),
    imagen_key: data.imagen_key ?? null,
    ...pickModalidad(data),
    ...pickHorario(data),
  });

  return getById(created.id);
};

export const update = async (id: number, data: UpdateRecursoData) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  const modalidad = pickModalidad(data);
  if (Object.keys(modalidad).length > 0) {
    const resultante = { ...recurso.get({ plain: true }), ...modalidad };
    if (!assertExperienciaCompleta(resultante)) {
      throw new AppError(
        422,
        "INVALID_ACTIVITY_MODE",
        "Una experiencia requiere duracion_minutos, cupo_maximo y precio_persona"
      );
    }
    // Cambiar la modalidad alteraría cómo se validan las reservas ya confirmadas.
    if (resultante.modalidad !== recurso.modalidad) {
      const confirmadas = await ReservaActividad.count({ where: { recurso_id: id, estado: "confirmada" } });
      if (confirmadas > 0) {
        throw new AppError(
          409,
          "ACTIVITY_MODE_IN_USE",
          "No se puede cambiar la modalidad de un recurso con reservas confirmadas"
        );
      }
    }
  }
  const horario = pickHorario(data);
  if (Object.keys(horario).length > 0 || Object.keys(modalidad).length > 0) {
    validarHorarioRecurso({ ...recurso.get({ plain: true }), ...modalidad, ...horario });
  }
  await recurso.update({
    ...modalidad,
    ...horario,
    ...(data.tipo !== undefined && { tipo: data.tipo }),
    ...(data.nombre !== undefined && { nombre: data.nombre }),
    ...(data.precio_hora !== undefined && { precio_hora: data.precio_hora }),
    ...(data.precio_equipo !== undefined && { precio_equipo: data.precio_equipo }),
    ...(data.precio_instructor_hora !== undefined && {
      precio_instructor_hora: data.precio_instructor_hora,
    }),
  });

  // Las reservas futuras se conservan; solo se informa cuántas quedan fuera del nuevo horario.
  const futuras = await ReservaActividad.findAll({
    where: { recurso_id: id, fecha: { [Op.gte]: ahoraEnGuatemala().fecha }, estado: "confirmada" },
    attributes: ["hora_inicio", "hora_fin"],
    raw: true,
  });
  await recurso.reload();
  return {
    ...(await getById(id)),
    reservas_fuera_de_horario: contarFueraDeHorario(
      (futuras as any[]).map((r) => ({ inicio: r.hora_inicio, fin: r.hora_fin })),
      leerHorario(recurso),
    ),
  };
};

export const remove = async (id: number) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }

  const usos = await ReservaActividad.count({ where: { recurso_id: id } });
  if (usos > 0) {
    throw new AppError(409, "RESOURCE_IN_USE", "El recurso no puede eliminarse porque tiene reservas asociadas");
  }

  const previousKey = recurso.imagen_key;
  await recurso.destroy();
  if (previousKey) {
    await mediaUploadService.cleanStorageObjectIfUnreferenced(previousKey);
  }
};

export const requestImageUpload = async (
  id: number,
  userId: number,
  contentType: string
) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  return mediaUploadService.presignEntityUpload({
    entityType: "recurso-actividad",
    entityId: id,
    contentType,
    userId,
  });
};

export const confirmImageUpload = async (
  id: number,
  userId: number,
  uploadToken: string,
  tempKey: string
) => {
  return mediaUploadService.confirmEntityUpload({
    entityType: "recurso-actividad",
    entityId: id,
    userId,
    uploadToken,
    tempKey,
    Model: RecursoActividad,
    column: "imagen_key",
    buildFinalKey: (recurso, ext) => {
      const storageSlug = mediaUploadService.resolveStorageSlug(recurso.sucursal_id);
      const rand = crypto.randomBytes(6).toString("hex");
      return `sedes/${storageSlug}/actividades/actividad-${recurso.id}-${Date.now()}-${rand}.${ext}`;
    },
    serializeEntity: serializeRecursoActividad,
  });
};

export const removeImage = async (id: number) => {
  return mediaUploadService.removeEntityImage({
    entityId: id,
    Model: RecursoActividad,
    column: "imagen_key",
    serializeEntity: serializeRecursoActividad,
  });
};

/**
 * Franjas reservables de un recurso en una fecha, con las mismas reglas que la
 * creación de reservas (inicios cada 30 minutos dentro del horario configurado):
 * - Experiencia: duración fija; una salida no puede solaparse con otra de distinto
 *   inicio, y cada salida informa las plazas que quedan de su cupo.
 * - Por hora: uso exclusivo; para cada inicio, las duraciones de 30 a 120 minutos
 *   que terminan antes del cierre sin solaparse con otra reserva confirmada.
 * Sin horario configurado no se ofrece ninguna franja.
 */
const franjasDelRecurso = (
  recurso: any,
  fecha: string,
  reservas: Array<{ hora_inicio: string; hora_fin: string; numero_participantes: number }>,
  clasesInstructor: Array<{ inicio: number; fin: number }> = [],
) => {
  const horario = leerHorario(recurso);
  const ocupadas = reservas.map((r) => ({ inicio: minutosDe(r.hora_inicio), fin: minutosDe(r.hora_fin), participantes: Number(r.numero_participantes) }));
  const solapa = (inicio: number, fin: number, excepto?: number) =>
    ocupadas.some((r) => r.inicio !== excepto && r.inicio < fin && r.fin > inicio) ||
    clasesInstructor.some((c) => c.inicio < fin && c.fin > inicio);
  if (recurso.modalidad === "experiencia") {
    const duracion = Number(recurso.duracion_minutos) || 0;
    const horarios = horario && duracion > 0
      ? iniciosDelDia(horario, duracion, fecha).flatMap((hora) => {
        const t = minutosDe(hora);
        if (solapa(t, t + duracion, t)) return [];
        const inscritos = ocupadas.filter((r) => r.inicio === t).reduce((sum, r) => sum + r.participantes, 0);
        return [{ inicio: hora, fin: horaDe(t + duracion), disponibles: Math.max(0, Number(recurso.cupo_maximo) - inscritos) }];
      })
      : [];
    return { horario, intervalo_minutos: INTERVALO_FRANJAS_MINUTOS, horarios };
  }
  const opciones: number[] = [];
  for (let d = DURACION_MINIMA_POR_HORA; d <= DURACION_MAXIMA_POR_HORA; d += INTERVALO_FRANJAS_MINUTOS) opciones.push(d);
  const horarios = horario
    ? iniciosDelDia(horario, DURACION_MINIMA_POR_HORA, fecha).flatMap((hora) => {
      const t = minutosDe(hora);
      const duraciones = opciones.filter((d) => t + d <= minutosDe(horario.cierre) && !solapa(t, t + d));
      return duraciones.length ? [{ inicio: hora, duraciones }] : [];
    })
    : [];
  return { horario, intervalo_minutos: INTERVALO_FRANJAS_MINUTOS, horarios };
};

/**
 * Clases confirmadas del instructor ese día en cualquier recurso (misma regla que
 * INSTRUCTOR_OVERLAP al confirmar). Solo aplica a recursos por hora; no expone datos de clientes.
 */
const clasesDelInstructor = async (recurso: any, fecha: string, instructorId?: number) => {
  if (!instructorId || recurso.modalidad === "experiencia") return [];
  const clases = await ReservaActividad.findAll({
    where: { instructor_id: instructorId, fecha, estado: "confirmada" },
    attributes: ["hora_inicio", "hora_fin"],
    raw: true,
  });
  return (clases as any[]).map((c) => ({ inicio: minutosDe(c.hora_inicio), fin: minutosDe(c.hora_fin) }));
};

/**
 * Ocupación pública de un recurso en una fecha: salidas confirmadas agrupadas
 * por hora de inicio. Solo expone conteos, nunca datos de los clientes.
 * En experiencias, "disponibles" es el cupo restante de cada salida.
 */
export const getSalidas = async (id: number, fecha: string, instructorId?: number) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  const reservas = await ReservaActividad.findAll({
    where: { recurso_id: id, fecha, estado: "confirmada" },
    attributes: ["hora_inicio", "hora_fin", "numero_participantes"],
    order: [["hora_inicio", "ASC"]],
    raw: true,
  });
  const experiencia = recurso.modalidad === "experiencia";
  const porInicio = new Map<string, { hora_inicio: string; hora_fin: string; participantes: number }>();
  for (const r of reservas as any[]) {
    const actual = porInicio.get(r.hora_inicio);
    if (actual) {
      actual.participantes += Number(r.numero_participantes);
      if (r.hora_fin > actual.hora_fin) actual.hora_fin = r.hora_fin;
    } else {
      porInicio.set(r.hora_inicio, { hora_inicio: r.hora_inicio, hora_fin: r.hora_fin, participantes: Number(r.numero_participantes) });
    }
  }
  return {
    recurso_id: recurso.id,
    fecha,
    modalidad: recurso.modalidad,
    cupo_maximo: experiencia ? recurso.cupo_maximo : null,
    ...franjasDelRecurso(recurso, fecha, reservas as any[], await clasesDelInstructor(recurso, fecha, instructorId)),
    salidas: [...porInicio.values()].map((salida) => ({
      ...salida,
      disponibles: experiencia ? Math.max(0, Number(recurso.cupo_maximo) - salida.participantes) : 0,
    })),
  };
};
