import { Op, QueryTypes } from "sequelize";

import { AppError } from "../../utils/AppError";

import { getIntentoActivo, reservationFinancialExposure } from "../pago.service";

import { ROLES, Role } from "../../constants/roles";
import { env } from "../../config/env";
import { computeExpiration, getReservationPaymentDeadline, isUncertainReservationPayment, isStayEnded, stampPendingReservationExpiration } from "./reservaExpiracion.policy";
import { attachRoomReservationToCart } from "../carrito/carritoItem.service";
import { SedeScope, assertHasSede, assertSedeAccess, sedeWhere } from "../../utils/sedeScope";



export interface RequesterContext {

  id: number;

  rol: Role;

}



const isAdministrativeRole = (role?: Role) =>

  role === ROLES.ADMIN ||

  role === ROLES.RECEPCIONISTA ||

  role === ROLES.GERENTE_HABITACIONES;



const db = require("../../models");



const {

  sequelize,

  ReservaHabitacion,

  Usuario,

  Habitacion,

  TipoHabitacion,

  Sucursal,

  Huesped,

} = db;



type EstadoReservaHabitacion =

  | "pendiente"

  | "confirmada"

  | "cancelada"

  | "finalizada"

  | "expirada";



/** Huésped sin cuenta atendido en recepción (titular alternativo a una cuenta de cliente). */
export interface HuespedPresencialData {
  nombre_completo: string;
  telefono?: string | null;
  email?: string | null;
}

interface CreateReservaHabitacionData {

  /** Cuenta de cliente titular; null cuando el titular es un huésped sin cuenta. */
  usuario_id: number | null;

  /** Solo personal: titular sin cuenta. Excluyente con usuario_id. */
  huesped?: HuespedPresencialData;

  /** Solo personal: empleado que registra la reserva (auditoría). */
  registrado_por_usuario_id?: number;

  habitacion_id: number;

  fecha_entrada: string;

  fecha_salida: string;

  numero_huespedes: number;

}



interface UpdateReservaHabitacionData {

  usuario_id?: number;

  habitacion_id?: number;

  fecha_entrada?: string;

  fecha_salida?: string;

  numero_huespedes?: number;

  estado?: EstadoReservaHabitacion;

}



const reservationExposureWithoutProcessing =

  async (

    id: number,

    transaction: any,

    message: string

  ) => {

    const exposure =

      await reservationFinancialExposure(

        id,

        transaction

      );



    if (exposure.processing > 0) {

      throw new AppError(

        409,

        "RESERVATION_HAS_PROCESSING_PAYMENT",

        message

      );

    }



    return exposure;

  };



const reservationInclude = [

  // Titular sin cuenta de una reserva presencial (alternativo a Usuario).
  {
    model: Huesped,
    attributes: ["id", "nombre_completo", "telefono", "email"],
    required: false,
  },

  {

    model: Usuario,

    attributes: [

      "id",

      "nombre",

      "email",

      "rol",

      "telefono",

      "activo",

      "createdAt",

      "updatedAt",

    ],

  },

  {

    model: Habitacion,

    include: [

      {

        model: TipoHabitacion,

      },

      {

        model: Sucursal,

        attributes: ["id", "nombre", "activa"],

        required: false,

      },

    ],

  },

];



/**

 * Estados que bloquean la disponibilidad de una habitación.

 *

 * Una reserva cancelada, finalizada o expirada ya no debe impedir

 * que la habitación pueda ser utilizada por otra reserva.

 */

const estadosQueBloqueanDisponibilidad =

  new Set<EstadoReservaHabitacion>([

    "pendiente",

    "confirmada",

  ]);



const bloqueaDisponibilidad = (

  estado: EstadoReservaHabitacion

) =>

  estadosQueBloqueanDisponibilidad.has(

    estado

  );



/**

 * Obtiene la fecha actual del negocio.

 *

 * Se utiliza America/Guatemala como valor por defecto,

 * pero puede configurarse mediante APP_TIMEZONE.

 */

export const getTodayDate = () => {

  const timeZone = env.APP_TIMEZONE;



  const parts =

    new Intl.DateTimeFormat(

      "en-US",

      {

        timeZone,

        year: "numeric",

        month: "2-digit",

        day: "2-digit",

      }

    ).formatToParts(new Date());



  const year =

    parts.find(

      (part) =>

        part.type === "year"

    )?.value;



  const month =

    parts.find(

      (part) =>

        part.type === "month"

    )?.value;



  const day =

    parts.find(

      (part) =>

        part.type === "day"

    )?.value;



  return `${year}-${month}-${day}`;

};



/**

 * La fecha de salida debe ser posterior

 * a la fecha de entrada.

 */

export const validateDates = (

  fechaEntrada: string,

  fechaSalida: string

) => {

  if (

    fechaSalida <=

    fechaEntrada

  ) {

    throw new AppError(

      422,

      "FECHAS_INVALIDAS",

      "La fecha de salida debe ser posterior a la fecha de entrada"

    );

  }

};



/**

 * Impide crear o reactivar una reserva cuya

 * fecha de entrada ya pasó.

 */

export const validateNotPast = (

  fechaEntrada: string

) => {

  const today =

    getTodayDate();



  if (

    fechaEntrada < today

  ) {

    throw new AppError(

      422,

      "ROOM_RESERVATION_DATE_IN_PAST",

      "La fecha de entrada no puede estar en el pasado"

    );

  }

};



/**

 * Una reserva solo puede finalizar cuando su

 * fecha de salida ya llegó en la fecha local del hotel.

 */

const validateReservationHasFinished = (

  fechaSalida: string

) => {

  if (

    fechaSalida >

    getTodayDate()

  ) {

    throw new AppError(

      409,

      "RESERVATION_NOT_FINISHED",

      "La reserva todavía no ha finalizado"

    );

  }

};



/**

 * Valida la capacidad máxima definida por

 * el tipo de habitación.

 */

const validateCapacidad = (

  numeroHuespedes: number,

  capacidadMaxima: number

) => {

  if (

    numeroHuespedes >

    capacidadMaxima

  ) {

    throw new AppError(

      422,

      "CAPACIDAD_EXCEDIDA",

      "El número de huéspedes excede la capacidad máxima de la habitación"

    );

  }

};



/**

 * Una habitación en mantenimiento no puede

 * recibir nuevas reservas activas.

 *

 * No bloqueamos automáticamente "ocupada" porque

 * una habitación ocupada hoy puede reservarse

 * para una fecha futura.

 */

const validateHabitacionReservable = (

  habitacion: any

) => {

  if (

    habitacion.estado ===

    "mantenimiento"

  ) {

    throw new AppError(

      409,

      "HABITACION_EN_MANTENIMIENTO",

      "La habitación se encuentra en mantenimiento y no puede ser reservada"

    );

  }

};



/**

 * Calcula la cantidad de noches.

 */

export const getNights = (

  fechaEntrada: string,

  fechaSalida: string

) =>

  Math.round(

    (

      Date.parse(

        `${fechaSalida}T00:00:00Z`

      ) -

      Date.parse(

        `${fechaEntrada}T00:00:00Z`

      )

    ) /

      (

        1000 *

        60 *

        60 *

        24

      )

  );



/**

 * Comprueba que usuario y habitación existan.

 * También carga TipoHabitacion porque necesitamos

 * tarifa y capacidad.

 */

const validateReferences =

  async (

    usuarioId: number,

    habitacionId: number,

    transaction?: any

  ) => {

    const usuario =

      await Usuario.findByPk(

        usuarioId,

        {

          transaction,

        }

      );



    if (!usuario) {

      throw new AppError(

        404,

        "USUARIO_NOT_FOUND",

        "El usuario no fue encontrado"

      );

    }



    const habitacion =

      await Habitacion.findByPk(

        habitacionId,

        {

          include: [

            {

              model:

                TipoHabitacion,

            },

          ],

          transaction,

        }

      );



    if (

      !habitacion ||

      !habitacion.TipoHabitacion

    ) {

      throw new AppError(

        404,

        "HABITACION_NOT_FOUND",

        "La habitación no fue encontrada"

      );

    }



    return habitacion;

  };


/**
 * Comprueba referencias dentro de una transacción y
 * bloquea la fila de la habitación con SELECT ... FOR UPDATE.
 *
 * Esto serializa las reservas concurrentes de una misma
 * habitación y evita el overbooking.
 */
const validateLockedReferences = async (

  usuarioId: number | null,

  habitacionId: number,

  transaction: any

) => {

  // Reserva de huésped sin cuenta: no hay usuario titular que validar.
  const usuario =

    usuarioId === null ? null : await Usuario.findByPk(

      usuarioId,

      {

        transaction,

      }

    );



  if (usuarioId !== null && !usuario) {

    throw new AppError(

      404,

      "USUARIO_NOT_FOUND",

      "El usuario no fue encontrado"

    );

  }



  const habitacion =

    await Habitacion.findByPk(

      habitacionId,

      {

        transaction,

        lock:

          transaction

            .LOCK

            .UPDATE,

      }

    );



  if (!habitacion) {

    throw new AppError(

      404,

      "HABITACION_NOT_FOUND",

      "La habitación no fue encontrada"

    );

  }



  /**
   * El tipo se carga por separado para que el FOR UPDATE
   * recaiga claramente sobre la fila de habitaciones.
   */
  const tipoHabitacion =

    await TipoHabitacion.findByPk(

      habitacion

        .tipo_habitacion_id,

      {

        transaction,

        lock:

          transaction

            .LOCK

            .SHARE,

      }

    );



  if (!tipoHabitacion) {

    throw new AppError(

      404,

      "HABITACION_NOT_FOUND",

      "La habitación no fue encontrada"

    );

  }



  return {

    usuario,

    habitacion,

    tipoHabitacion,

  };

};

/**
 * Reserva registrada por el personal en nombre de un huésped: el titular debe
 * ser una cuenta de cliente activa, nunca el propio personal ni otra cuenta
 * administrativa.
 */
const validateHuespedCliente = (usuario: any) => {
  if (usuario.rol !== ROLES.CLIENTE || !usuario.activo) {
    throw new AppError(
      422,
      "HUESPED_INVALIDO",
      "La reserva debe registrarse a nombre de una cuenta de cliente activa"
    );
  }
};

/**
 * Búsqueda de huéspedes (cuentas de cliente activas) para que recepción
 * registre reservas a su nombre. Solo expone datos de identificación y exige
 * que el personal tenga al menos una sede asignada.
 */
export const searchHuespedes = async (term: string, scope: SedeScope) => {
  assertHasSede(scope);
  const q = term.trim();
  if (q.length < 2) return [];
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const id = /^\d+$/.test(q) ? Number(q) : null;
  return Usuario.findAll({
    where: {
      rol: ROLES.CLIENTE,
      activo: true,
      [Op.or]: [
        { nombre: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
        ...(id !== null && Number.isSafeInteger(id) ? [{ id }] : []),
      ],
    },
    attributes: ["id", "nombre", "email", "telefono"],
    order: [["nombre", "ASC"], ["id", "ASC"]],
    limit: 10,
  });
};



/**

 * Detecta cualquier traslape con reservas

 * pendientes o confirmadas.

 */

const validateOverlap = async (

  habitacionId: number,

  fechaEntrada: string,

  fechaSalida: string,

  reservaId?: number,

  transaction?: any

) => {

  const where: any = {

    habitacion_id:

      habitacionId,



    estado: {

      [Op.in]: [

        "pendiente",

        "confirmada",

      ],

    },



    fecha_entrada: {

      [Op.lt]:

        fechaSalida,

    },



    fecha_salida: {

      [Op.gt]:

        fechaEntrada,

    },

  };



  /**

   * Durante un PATCH excluimos la propia reserva

   * para que no choque consigo misma.

   */

  if (

    reservaId !==

    undefined

  ) {

    where.id = {

      [Op.ne]: reservaId,

    };

  }



  const reservaExistente =

    await ReservaHabitacion.findOne({

      where,

      transaction,

    });



  if (reservaExistente) {

    throw new AppError(

      409,

      "HABITACION_NO_DISPONIBLE",

      "La habitación ya está reservada en esas fechas"

    );

  }

};



/**

 * Calcula el total de la reserva.

 */

export const calculateTotal = (

  fechaEntrada: string,

  fechaSalida: string,

  tarifaNoche: unknown

) =>

  (

    getNights(

      fechaEntrada,

      fechaSalida

    ) *

    Number(tarifaNoche)

  ).toFixed(2);



/**

 * LISTADO

 *

 * Administradores/recepción/gerencia:

 * pueden consultar todas.

 *

 * Cliente:

 * únicamente las propias.

 */

export const getAllReservaHabitaciones =
  async (
    requester?: RequesterContext,
    scope?: SedeScope,
    sucursalId?: number
  ) => {

    const where:

      Record<

        string,

        unknown

      > = {};



    if (

      requester &&

      !isAdministrativeRole(

        requester.rol

      )

    ) {

      where.usuario_id =
        requester.id;
      /**
       * Filtro de visualización sobre las propias.
       */
      if (sucursalId !== undefined) {
        where["$Habitacion.sucursal_id$"] = sucursalId;
      }
    } else if (scope) {
      /**
       * Personal administrativo: solo reservas de
       * habitaciones de sus sedes autorizadas; la
       * sede pedida debe estar dentro del alcance.
       */
      Object.assign(
        where,
        sedeWhere(scope, sucursalId ?? null, "$Habitacion.sucursal_id$")
      );
    } else if (sucursalId !== undefined) {
      where["$Habitacion.sucursal_id$"] = sucursalId;
    }



    return ReservaHabitacion.findAll(

      {

        where,

        include:

          reservationInclude,

        order: [["id", "ASC"]],

      }

    );

  };



/**

 * CONSULTA INDIVIDUAL

 */

export const getReservaHabitacionById =

  async (

    id: number,
    requester?: RequesterContext,
    scope?: SedeScope
  ) => {

    const reservaHabitacion =

      await ReservaHabitacion.findByPk(

        id,

        {

          include:

            reservationInclude,

        }

      );



    if (!reservaHabitacion) {

      throw new AppError(

        404,

        "RESERVA_HABITACION_NOT_FOUND",

        "La reserva de habitación no fue encontrada"

      );

    }



    if (

      requester &&

      !isAdministrativeRole(

        requester.rol

      )

    ) {

      if (

        reservaHabitacion.usuario_id !==

        requester.id

      ) {

        throw new AppError(

          403,

          "INSUFFICIENT_PERMISSIONS",

          "No tiene permisos para acceder a esta reserva de habitación"
        );
      }
    } else if (scope) {
      assertSedeAccess(
        scope,
        reservaHabitacion.Habitacion?.sucursal_id
      );
    }



    return reservaHabitacion;

  };



/**
 * CREAR RESERVA
 *
 * La comprobación de disponibilidad y el INSERT
 * ocurren dentro de la misma transacción.
 *
 * La fila de la habitación se bloquea con
 * SELECT ... FOR UPDATE para impedir overbooking
 * bajo solicitudes concurrentes.
 */
export const createReservaHabitacion =

  async (

    data:
      CreateReservaHabitacionData,
    scope?: SedeScope,
    options?: { agregarAlCarrito?: boolean }
  ) => {

    /**
     * Validaciones que no requieren acceso a BD.
     */
    validateDates(

      data.fecha_entrada,

      data.fecha_salida

    );



    validateNotPast(

      data.fecha_entrada

    );



    return sequelize.transaction(

      async (

        transaction: any

      ) => {

        /**
         * Validamos referencias y bloqueamos la habitación.
         *
         * Las solicitudes concurrentes para la misma habitación
         * quedarán esperando aquí hasta que la transacción actual
         * termine.
         */
        const {

          usuario,

          habitacion,

          tipoHabitacion,

        } =

          await validateLockedReferences(

            data.usuario_id,

            data.habitacion_id,
            transaction
          );

        // Exactamente un titular: cuenta de cliente o, solo para el personal, huésped sin cuenta.
        if ((data.usuario_id === null) === !data.huesped || (data.huesped && !scope)) {
          throw new AppError(422, "TITULAR_INVALIDO", "Indique una cuenta de cliente o los datos del huésped, no ambos");
        }

        if (scope) {
          assertSedeAccess(
            scope,
            habitacion.sucursal_id
          );
          if (!data.huesped) validateHuespedCliente(usuario);
        }

        validateHabitacionReservable(

          habitacion

        );

        // Una sede desactivada conserva sus reservas, pero no admite nuevas.
        const sede = await Sucursal.findByPk(habitacion.sucursal_id, { attributes: ["id", "activa"], transaction });
        if (!sede?.activa) {
          throw new AppError(409, "SUCURSAL_INACTIVA", "La sede no está disponible para nuevas reservas");
        }



        validateCapacidad(

          data.numero_huespedes,

          tipoHabitacion

            .capacidad_maxima

        );



        /**
         * Esta comprobación ocurre después de tomar el lock.
         *
         * Si otra petición ya creó una reserva mientras esperábamos,
         * ahora será visible y devolveremos 409.
         */
        if (options?.agregarAlCarrito) {
          /**
           * Reintento idempotente (doble clic, error de red, dos pestañas): si el mismo cliente ya tiene una reserva
           * pendiente idéntica, se reutiliza y solo se garantiza su vínculo con el carrito. Las solicitudes idénticas se
           * serializan por el bloqueo de la habitación que toma validateLockedReferences; el carrito se serializa por usuario.
           */
          const existente = await ReservaHabitacion.findOne({
            where: {
              usuario_id: data.usuario_id,
              habitacion_id: data.habitacion_id,
              fecha_entrada: data.fecha_entrada,
              fecha_salida: data.fecha_salida,
              numero_huespedes: data.numero_huespedes,
              estado: "pendiente",
            },
            transaction,
          });
          if (existente) {
            // Reutilizar NUNCA extiende un plazo vencido ni reinicia el límite de la reserva.
            const limite = await getReservationPaymentDeadline(existente.id, transaction);
            if (limite && limite.getTime() <= Date.now()) {
              throw new AppError(409, "RESERVATION_PAYMENT_WINDOW_EXPIRED", "El plazo para pagar la reserva venció. Cancélela y cree una nueva");
            }
            const plazo = limite ?? new Date(Date.now() + env.CART_EXPIRATION_MINUTES * 60_000); // sin límite almacenado: plazo clásico del carrito
            const carrito = await attachRoomReservationToCart(existente.id, Number(data.usuario_id), plazo, transaction);
            return { reserva: existente, reutilizada: true, carrito };
          }
        }
        await validateOverlap(

          data.habitacion_id,

          data.fecha_entrada,

          data.fecha_salida,

          undefined,

          transaction

        );



        const total =

          calculateTotal(

            data.fecha_entrada,

            data.fecha_salida,

            tipoHabitacion

              .tarifa_noche

          );



        // Huésped sin cuenta: registro persistente en la misma transacción que la reserva.
        const huesped = data.huesped
          ? await Huesped.create({
              nombre_completo: data.huesped.nombre_completo.trim(),
              telefono: data.huesped.telefono?.trim() || null,
              email: data.huesped.email?.trim().toLowerCase() || null,
              sucursal_id: habitacion.sucursal_id,
              registrado_por_usuario_id: data.registrado_por_usuario_id,
            }, { transaction })
          : null;

        const reservaCreada = await ReservaHabitacion.create(

          {

            usuario_id:

              data.usuario_id,

            huesped_id: huesped?.id ?? null,

            registrado_por_usuario_id: scope ? data.registrado_por_usuario_id ?? null : null,



            habitacion_id:

              data.habitacion_id,



            fecha_entrada:

              data.fecha_entrada,



            fecha_salida:

              data.fecha_salida,



            numero_huespedes:

              data.numero_huespedes,



            estado:

              "pendiente",



            total,

          },

          {

            transaction,

          }

        );
        // Plazo de pago de la reserva pendiente (inerte mientras la política esté desactivada).
        await stampPendingReservationExpiration(reservaCreada.id, transaction);
        if (options?.agregarAlCarrito) {
          // Mismo plazo inicial que la reserva: un carrito nuevo vence cuando vence el límite de pago de la reserva.
          const carrito = await attachRoomReservationToCart(reservaCreada.id, Number(data.usuario_id), computeExpiration(new Date()), transaction);
          return { reserva: reservaCreada, reutilizada: false, carrito };
        }
        return reservaCreada;

      }

    );

  };



/**

 * ACTUALIZAR RESERVA

 */

/**
 * Sede de la habitación actual de una reserva. Lectura sin bloqueo para no
 * alterar el orden de locks Reserva -> Habitación destino.
 */
const assertReservaEnAlcance = async (
  reservaHabitacion: any,
  scope: SedeScope | undefined,
  transaction: any
) => {
  if (!scope || scope.global) return;
  const habitacionActual = await Habitacion.findByPk(
    reservaHabitacion.habitacion_id,
    { attributes: ["id", "sucursal_id"], transaction }
  );
  assertSedeAccess(scope, habitacionActual?.sucursal_id);
};

export const updateReservaHabitacion =

  async (

    id: number,
    data:
      UpdateReservaHabitacionData,
    scope?: SedeScope
  ) => sequelize.transaction(async (

    transaction: any

  ) => {

    const reservaHabitacion =

      await ReservaHabitacion.findByPk(

        id,

        {

          transaction,

          lock:

            transaction

              .LOCK

              .UPDATE,

        }

      );



    if (!reservaHabitacion) {

      throw new AppError(

        404,

        "RESERVA_HABITACION_NOT_FOUND",

        "La reserva de habitación no fue encontrada"

      );

    }



    await assertReservaEnAlcance(
      reservaHabitacion,
      scope,
      transaction
    );

    /**
     * Calculamos cómo quedaría finalmente

     * la reserva después del PATCH.

     */

    // Una reserva presencial conserva su huésped sin cuenta: no se reasigna a una cuenta por PATCH.
    if (data.usuario_id !== undefined && reservaHabitacion.huesped_id != null) {
      throw new AppError(409, "TITULAR_PRESENCIAL", "El titular de una reserva de huésped sin cuenta no puede cambiarse a una cuenta de cliente");
    }

    const usuarioId =

      data.usuario_id ??

      reservaHabitacion.usuario_id;



    const habitacionId =

      data.habitacion_id ??

      reservaHabitacion.habitacion_id;



    const fechaEntrada =

      data.fecha_entrada ??

      reservaHabitacion.fecha_entrada;



    const fechaSalida =

      data.fecha_salida ??

      reservaHabitacion.fecha_salida;



    const numeroHuespedes =

      data.numero_huespedes ??

      reservaHabitacion.numero_huespedes;



    const estadoActual =

      reservaHabitacion.estado as

        EstadoReservaHabitacion;



    const estadoDestino =

      data.estado ??

      estadoActual;



    const seEstaCancelando =

      estadoActual !==

        "cancelada" &&

      estadoDestino ===

        "cancelada";



    if (

      estadoActual !==

        "finalizada" &&

      estadoDestino ===

        "finalizada"

    ) {

      validateReservationHasFinished(

        fechaSalida

      );

    }



    /**

     * Comprobamos si cambió algún dato operativo

     * de la reserva.

     */

    const datosReservaCambiaron =

      data.usuario_id !== undefined ||

      data.habitacion_id !==

        undefined ||

      data.fecha_entrada !==

        undefined ||

      data.fecha_salida !==

        undefined ||

      data.numero_huespedes !==

        undefined;



    const cambiaIdentidadEconomica =

      data.usuario_id !== undefined ||

      data.habitacion_id !== undefined ||

      data.fecha_entrada !== undefined ||

      data.fecha_salida !== undefined;



    const cambiaTotal =

      data.habitacion_id !== undefined ||

      data.fecha_entrada !== undefined ||

      data.fecha_salida !== undefined;



    let proposedTotal =

      String(

        reservaHabitacion.total

      );



    /**

     * Detectamos si una reserva que antes NO

     * bloqueaba disponibilidad vuelve a convertirse

     * en pendiente o confirmada.

     *

     * Ejemplo:

     * cancelada -> confirmada

     */

    const seEstaReactivando =

      !bloqueaDisponibilidad(

        estadoActual

      ) &&

      bloqueaDisponibilidad(

        estadoDestino

      );



    /**

     * Las reglas de negocio deben volver a

     * ejecutarse cuando:

     *

     * - cambian fechas/habitación/huéspedes/usuario;

     * - o una reserva inactiva se reactiva.

     */

    if (

      datosReservaCambiaron ||

      seEstaReactivando

    ) {

      validateDates(

        fechaEntrada,

        fechaSalida

      );



      const {

        habitacion,

        tipoHabitacion,

      } =

        await validateLockedReferences(
          usuarioId,
          habitacionId,
          transaction
        );

      /**
       * La habitación de destino también debe pertenecer
       * a una sede autorizada.
       */
      if (scope) {
        assertSedeAccess(
          scope,
          habitacion.sucursal_id
        );
      }



      validateCapacidad(

        numeroHuespedes,

        tipoHabitacion

          .capacidad_maxima

      );



      /**

       * Solamente las reservas pendientes o

       * confirmadas bloquean disponibilidad.

       */

      if (

        bloqueaDisponibilidad(

          estadoDestino

        )

      ) {

        validateNotPast(

          fechaEntrada

        );



        validateHabitacionReservable(

          habitacion

        );



        await validateOverlap(

          habitacionId,

          fechaEntrada,

          fechaSalida,

          id,

          transaction

        );

      }



      if (cambiaIdentidadEconomica) {

        proposedTotal =

          calculateTotal(

            fechaEntrada,

            fechaSalida,

            tipoHabitacion

              .tarifa_noche

          );

      }

    }



    if (

      cambiaIdentidadEconomica ||

      seEstaCancelando

    ) {

      const exposure =

        await reservationExposureWithoutProcessing(

          id,

          transaction,

          seEstaCancelando

            ? "La reserva tiene un pago en procesamiento y no puede cancelarse"

            : "La reserva tiene un pago en procesamiento y no puede modificarse económicamente"

        );



      if (

        cambiaIdentidadEconomica &&

        exposure.total >

          Number(proposedTotal)

      ) {

        throw new AppError(

          409,

          "PAYMENT_EXCEEDS_NEW_TOTAL",

          "Los pagos existentes exceden el nuevo total de la reserva"

        );

      }

    }



    const total =

      cambiaTotal

        ? proposedTotal

        : undefined;



    const updateData:

      Record<

        string,

        unknown

      > = {

      ...(data.usuario_id !==

      undefined

        ? {

            usuario_id:

              data.usuario_id,

          }

        : {}),



      ...(data.habitacion_id !==

      undefined

        ? {

            habitacion_id:

              data.habitacion_id,

          }

        : {}),



      ...(data.fecha_entrada !==

      undefined

        ? {

            fecha_entrada:

              data.fecha_entrada,

          }

        : {}),



      ...(data.fecha_salida !==

      undefined

        ? {

            fecha_salida:

              data.fecha_salida,

          }

        : {}),



      ...(data.numero_huespedes !==

      undefined

        ? {

            numero_huespedes:

              data.numero_huespedes,

          }

        : {}),



      ...(data.estado !==

      undefined

        ? {

            estado:

              data.estado,

          }

        : {}),



      ...(total !== undefined

        ? {

            total,

          }

        : {}),

    };



    await reservaHabitacion.update(

      updateData,

      {

        transaction,

      }

    );



    return reservaHabitacion;

  });



/**

 * CANCELACIÓN LÓGICA

 *

 * No eliminamos físicamente la reserva porque

 * necesitamos conservar el historial.

 */

export const deleteReservaHabitacion =
  async (id: number, scope?: SedeScope) => sequelize.transaction(async (

    transaction: any

  ) => {

    const reservaHabitacion =

      await ReservaHabitacion.findByPk(

        id,

        {

          transaction,

          lock:

            transaction

              .LOCK

              .UPDATE,

        }

      );



    if (!reservaHabitacion) {

      throw new AppError(

        404,

        "RESERVA_HABITACION_NOT_FOUND",

        "La reserva de habitación no fue encontrada"

      );

    }



    await assertReservaEnAlcance(
      reservaHabitacion,
      scope,
      transaction
    );

    await reservationExposureWithoutProcessing(

        id,

        transaction,

        "La reserva tiene un pago en procesamiento y no puede cancelarse"

      );



    await reservaHabitacion.update(

      {

        estado: "cancelada",

      },

      {

        transaction,

      }

    );



    return reservaHabitacion;

  });


const isDeadlock = (error: any) => error?.original?.code === "40P01" || error?.parent?.code === "40P01";

/**
 * Cancelación voluntaria de una reserva PROPIA (cliente). Cancelación lógica solo de reservas pendientes
 * sin pago aprobado ni pago que todavía pueda completarse.
 *
 * - La titularidad se toma de la sesión; una reserva ajena se informa como inexistente (404).
 * - Mismo orden de bloqueos que createPago: Carrito -> ReservaHabitacion -> Pago, por lo que una cancelación y la
 *   creación de un pago concurrente se serializan: o bien el pago ya existe y se ve aquí, o bien la reserva queda
 *   cancelada y createPago la rechaza.
 * - Idempotente: repetir la cancelación de una reserva ya cancelada propia responde igual sin cambios.
 * - No cancela PaymentIntents, no modifica pagos ni carritos.
 */
export const cancelOwnReservaHabitacion = async (id: number, userId: number) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await sequelize.transaction(async (transaction: any) => {
        const q = (sql: string, replacements: Record<string, unknown>) =>
          sequelize.query(sql, { replacements, type: QueryTypes.SELECT, transaction }) as Promise<Array<Record<string, any>>>;
        const cartRows = await q(
          `SELECT DISTINCT carrito_id FROM carrito_items WHERE tipo_item = 'habitacion' AND referencia_id = :id ORDER BY carrito_id`,
          { id },
        );
        const cartIds = cartRows.map(row => Number(row.carrito_id));
        if (cartIds.length) await q(`SELECT id FROM carritos WHERE id IN (:ids) ORDER BY id FOR UPDATE`, { ids: cartIds });
        const [row] = await q(`SELECT id, usuario_id, estado FROM reservas_habitacion WHERE id = :id FOR UPDATE`, { id });
        if (!row || Number(row.usuario_id) !== Number(userId)) {
          throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
        }
        if (row.estado === "cancelada") {
          return { reserva: await ReservaHabitacion.findByPk(id, { transaction }), ya_cancelada: true };
        }
        if (row.estado !== "pendiente") {
          throw new AppError(
            409,
            "RESERVATION_NOT_CANCELLABLE",
            row.estado === "confirmada"
              ? "Una reserva confirmada y pagada no puede cancelarse desde aquí"
              : "La reserva ya no puede cancelarse",
          );
        }
        // Volver a descubrir vínculos después del bloqueo: checkout puede haber
        // añadido un carrito y registrado su pago mientras esperábamos la reserva.
        const payments = await getRoomPayments(id, transaction, true);
        if (payments.some(p => ["aprobado", "reembolsado", "reembolsado_parcial"].includes(String(p.estado)))) {
          throw new AppError(409, "RESERVATION_HAS_APPROVED_PAYMENT", "La reserva tiene un pago aprobado y no puede cancelarse desde aquí");
        }
        if (payments.some(isUncertainReservationPayment)) {
          throw new AppError(409, "RESERVATION_PAYMENT_IN_PROGRESS",
            "No podemos cancelar mientras el estado del pago sea incierto. Consulte su estado o contacte con el hotel; la reserva permanece protegida");
        }
        await ReservaHabitacion.update({ estado: "cancelada" }, { where: { id, estado: "pendiente" }, transaction });
        return { reserva: await ReservaHabitacion.findByPk(id, { transaction }), ya_cancelada: false };
      });
    } catch (error) {
      // Un interbloqueo con el webhook de pago se reintenta; la transacción se revierte por completo.
      if (isDeadlock(error) && attempt < 2) continue;
      if (isDeadlock(error)) throw new AppError(409, "RESERVATION_BUSY", "La reserva está siendo procesada. Inténtelo de nuevo en unos segundos");
      throw error;
    }
  }
};


/**
 * "Continuar con el pago": reanuda una reserva PROPIA pendiente que ya no está en un carrito vigente (p. ej. el carrito
 * venció antes que la reserva). Reutiliza la reserva existente y la vincula, de forma idempotente, con un carrito válido.
 *
 * - No crea una reserva nueva ni amplía expira_en: el carrito nuevo vence, como máximo, en el límite original de la reserva.
 * - No toca los demás artículos ni el vencimiento de un carrito existente con artículos (ver attachRoomReservationToCart).
 * - Se rechaza si la reserva venció, ya no es pendiente, tiene un cobro aprobado o un pago en curso, o si el carrito
 *   activo tiene un pago en procesamiento. Nunca abre Stripe ni crea pagos.
 * - Orden de bloqueos: Usuario -> Carrito -> Reserva -> Pago (compatible con createPago).
 */
export const resumeOwnReservaHabitacion = async (id: number, userId: number) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await sequelize.transaction(async (transaction: any) => {
        const q = (sql: string, replacements: Record<string, unknown>) =>
          sequelize.query(sql, { replacements, type: QueryTypes.SELECT, transaction }) as Promise<Array<Record<string, any>>>;
        const [pre] = await q(`SELECT usuario_id, estado, fecha_salida FROM reservas_habitacion WHERE id = :id`, { id });
        if (!pre || Number(pre.usuario_id) !== Number(userId)) {
          throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
        }
        if (pre.estado !== "pendiente") {
          throw new AppError(409, "RESERVATION_NOT_PAYABLE", "La reserva ya no está pendiente de pago");
        }
        if (isStayEnded(pre.fecha_salida)) {
          throw new AppError(409, "RESERVATION_STAY_ENDED", "La estancia de esta reserva ya terminó y no puede pagarse");
        }
        const limite = await getReservationPaymentDeadline(id, transaction);
        if (limite && limite.getTime() <= Date.now()) {
          throw new AppError(409, "RESERVATION_PAYMENT_WINDOW_EXPIRED", "El plazo para pagar la reserva venció. Cancélela y cree una nueva");
        }
        const plazo = limite ?? new Date(Date.now() + env.CART_EXPIRATION_MINUTES * 60_000);
        const carrito = await attachRoomReservationToCart(id, userId, plazo, transaction);
        // Reconfirmación bajo el bloqueo de la reserva y de sus pagos (incluidos los de carritos anteriores).
        const [row] = await q(`SELECT estado, fecha_salida FROM reservas_habitacion WHERE id = :id FOR UPDATE`, { id });
        if (!row || row.estado !== "pendiente") throw new AppError(409, "RESERVATION_NOT_PAYABLE", "La reserva ya no está pendiente de pago");
        if (isStayEnded(row.fecha_salida)) {
          throw new AppError(409, "RESERVATION_STAY_ENDED", "La estancia de esta reserva ya terminó y no puede pagarse");
        }
        const currentDeadline = await getReservationPaymentDeadline(id, transaction);
        if (currentDeadline && currentDeadline.getTime() <= Date.now()) {
          throw new AppError(409, "RESERVATION_PAYMENT_WINDOW_EXPIRED", "El plazo para pagar la reserva venció");
        }
        const payments = await getRoomPayments(id, transaction, true);
        if (payments.some(p => ["aprobado", "reembolsado", "reembolsado_parcial"].includes(String(p.estado)))) {
          throw new AppError(409, "RESERVATION_HAS_APPROVED_PAYMENT", "La reserva ya tiene un pago aprobado");
        }
        if (payments.some(isUncertainReservationPayment)) {
          throw new AppError(409, "RESERVATION_PAYMENT_IN_PROGRESS", "La reserva tiene un pago pendiente de verificar. Consulte su estado o contacte con el hotel");
        }
        return { reserva: await ReservaHabitacion.findByPk(id, { transaction }), carrito };
      });
    } catch (error) {
      if (isDeadlock(error) && attempt < 2) continue;
      if (isDeadlock(error)) throw new AppError(409, "RESERVATION_BUSY", "La reserva está siendo procesada. Inténtelo de nuevo en unos segundos");
      throw error;
    }
  }
};


/** Pagos directos y de todos los carritos históricos, incluyendo vínculos recién confirmados. */
const getRoomPayments = async (id: number, transaction: any, lock = false): Promise<any[]> =>
  sequelize.query(
    `SELECT p.* FROM pagos p WHERE p.reserva_habitacion_id = :id OR p.carrito_id IN (
      SELECT carrito_id FROM carrito_items WHERE tipo_item = 'habitacion' AND referencia_id = :id
    ) ORDER BY p.id ${lock ? 'FOR UPDATE OF p' : ''}`,
    { replacements: { id }, type: QueryTypes.SELECT, transaction },
  );

/** Lectura propia: no crea reservas, carritos, pagos ni intentos de Stripe. */
export const getOwnReservationPaymentStatus = async (id: number, userId: number) => {
  const snapshot = await sequelize.transaction({ isolationLevel: "REPEATABLE READ" }, async (transaction: any) => {
    const reservation = await ReservaHabitacion.findByPk(id, { transaction });
    if (!reservation || Number(reservation.usuario_id) !== userId) {
      throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
    }
    const payments = await getRoomPayments(id, transaction);
    const deadline = await getReservationPaymentDeadline(id, transaction);
    const unavailable = reservation.estado !== "pendiente" || isStayEnded(reservation.fecha_salida) ||
      Boolean(deadline && deadline.getTime() <= Date.now());
    const paid = payments.some(p => ["aprobado", "reembolsado", "reembolsado_parcial"].includes(p.estado));
    const uncertain = payments.filter(isUncertainReservationPayment);
    return { unavailable, paid, uncertain };
  });
  const data: {
    estado: "pagable" | "pagada" | "no_disponible" | "incierto" | "reanudable";
    pago_id: number | null;
    carrito_id: number | null;
  } = { estado: "pagable", pago_id: null, carrito_id: null };
  if (snapshot.paid) return { ...data, estado: "pagada" as const };
  if (snapshot.uncertain.length) {
    data.estado = "incierto";
    const payment = snapshot.uncertain[0];
    // Solo se publica un enlace cuyo pago pertenece también al titular.
    // Un carrito histórico no autoriza por sí solo acceso a un pago ajeno.
    if (payment.carrito_id == null) data.pago_id = Number(payment.id);
    else {
      const [cart] = await sequelize.query(`SELECT usuario_id FROM carritos WHERE id = :id`, {
        replacements: { id: payment.carrito_id }, type: QueryTypes.SELECT,
      }) as Array<{ usuario_id: number }>;
      if (Number(cart?.usuario_id) === userId) data.pago_id = Number(payment.id);
    }
    if (!snapshot.unavailable && snapshot.uncertain.length === 1 && data.pago_id &&
        payment.carrito_id != null && payment.metodo === "tarjeta" && payment.estado === "procesando" && payment.id_transaccion_externo) {
      try {
        // Consulta remota fuera de la transacción. El checkout reutiliza este intento;
        // aquí no se llama a continuar-pago ni se agrega la reserva a otro carrito.
        const intent = await getIntentoActivo({ carrito_id: Number(payment.carrito_id) }, { id: userId, rol: ROLES.CLIENTE });
        if (intent?.pago_id === data.pago_id && intent.puede_confirmar && intent.client_secret) {
          data.estado = "reanudable";
          data.carrito_id = Number(payment.carrito_id);
        }
      } catch {
        // Una consulta fallida no demuestra ausencia de pago: conservar "incierto".
      }
    }
    return data;
  }
  if (snapshot.unavailable) data.estado = "no_disponible";
  return data;
};
