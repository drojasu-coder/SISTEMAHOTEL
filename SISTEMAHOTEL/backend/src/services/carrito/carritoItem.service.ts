import { AppError }
  from "../../utils/AppError";

import {
  ROLES,
  Role,
} from "../../constants/roles";

import {
  CartItemType,
} from "../../constants/cart";
import { isReservationFullyPaid } from "../pago.service";

const db = require("../../models");

const {
  sequelize,

  Carrito,
  CarritoItem,
  Promocion,

  ReservaHabitacion,
  ReservaEvento,
  ReservaMesa,
  ReservaActividad,
  ReservaAmenidad,
  CitaBienestar,
  ServicioBienestar,
  BoletoParque,
  ReservaTransporte,
} = db;

interface ResolvedItem {
  descripcion: string;
  precio: number;
  usuarioId: number;
}

// ======================================================
// ESTADOS QUE NO PUEDEN COMPRARSE
// ======================================================

const terminalStates =
  new Set([
    "cancelada",
    "cancelado",
    "expirada",
    "expirado",
    "pagado",
    "usado",
    "completada",
    "completado",
  ]);

const validateReferenceState = (
  estado?: string | null
) => {
  if (!estado) {
    return;
  }

  if (
    terminalStates.has(
      String(
        estado
      ).toLowerCase()
    )
  ) {
    throw new AppError(
      409,
      "CART_REFERENCE_NOT_AVAILABLE",
      "La referencia seleccionada ya no se encuentra disponible"
    );
  }
};

// ======================================================
// VALIDAR PRECIO
// ======================================================

const normalizePrice = (
  value: unknown
) => {
  const price =
    Number(value);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new AppError(
      422,
      "INVALID_ITEM_PRICE",
      "No fue posible determinar un precio válido para el ítem"
    );
  }

  return Math.round(
    (
      price +
      Number.EPSILON
    ) * 100
  ) / 100;
};

// ======================================================
// EXPIRAR CARRITO SI CORRESPONDE
// ======================================================

const expireCartIfNeeded =
  async (
    carritoId: number
  ) => {
    const carrito =
      await Carrito.findByPk(
        carritoId
      );

    if (!carrito) {
      return;
    }

    if (
      carrito.estado ===
        "activo" &&
      carrito.expira_en &&
      new Date(
        carrito.expira_en
      ).getTime() <=
        Date.now()
    ) {
      await carrito.update({
        estado:
          "expirado",
      });
    }
  };

// ======================================================
// VALIDAR CARRITO Y ACCESO
// ======================================================

const getCartForAccess =
  async (
    carritoId: number,
    requesterId: number,
    requesterRole: Role,
    requireActive = false,
    transaction?: any,
    lock = false
  ) => {
    const options: any = {
      transaction,
    };

    if (
      transaction &&
      lock
    ) {
      options.lock =
        transaction.LOCK.UPDATE;
    }

    const carrito =
      await Carrito.findByPk(
        carritoId,
        options
      );

    if (!carrito) {
      throw new AppError(
        404,
        "CART_NOT_FOUND",
        "El carrito solicitado no existe"
      );
    }

    /*
     * Administrador:
     * puede consultar cualquier carrito.
     *
     * Cliente:
     * únicamente puede acceder a sus propios carritos.
     */
    if (
      requesterRole !==
        ROLES.ADMIN &&
      carrito.usuario_id !==
        requesterId
    ) {
      throw new AppError(
        403,
        "INSUFFICIENT_PERMISSIONS",
        "No tiene permisos para acceder a este carrito"
      );
    }

    /*
     * Las operaciones de modificación solamente
     * pueden realizarse sobre carritos activos.
     */
    if (
      requireActive &&
      carrito.estado !==
        "activo"
    ) {
      throw new AppError(
        409,
        "CART_NOT_ACTIVE",
        "El carrito ya no se encuentra activo"
      );
    }

    return carrito;
  };

// ======================================================
// PROPIEDAD DE LA REFERENCIA
// ======================================================

const validateOwnership = (
  referenceUserId: number,
  carritoUserId: number
) => {
  if (
    referenceUserId !==
    carritoUserId
  ) {
    throw new AppError(
      403,
      "CART_REFERENCE_NOT_OWNED",
      "La referencia seleccionada no pertenece al propietario del carrito"
    );
  }
};

// ======================================================
// RESOLVER HABITACIÓN
// ======================================================

const resolveHabitacion =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const reserva =
      await ReservaHabitacion.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "La reserva de habitación no existe"
      );
    }

    validateOwnership(
      reserva.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      reserva.estado
    );
    if (
      await isReservationFullyPaid(
        reserva.id,
        reserva.total,
        transaction,
      )
    ) {
      throw new AppError(
        409,
        "CART_REFERENCE_NOT_AVAILABLE",
        "La reserva seleccionada ya no se encuentra disponible"
      );
    }

    return {
      usuarioId:
        reserva.usuario_id,

      descripcion:
        `Reserva de habitación #${reserva.id} (${reserva.fecha_entrada} a ${reserva.fecha_salida})`,

      precio:
        normalizePrice(
          reserva.total
        ),
    };
  };

// ======================================================
// RESOLVER EVENTO
// ======================================================

const resolveEvento =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const reserva =
      await ReservaEvento.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "La reserva de evento no existe"
      );
    }

    validateOwnership(
      reserva.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      reserva.estado
    );

    return {
      usuarioId:
        reserva.usuario_id,

      descripcion:
        `Evento ${reserva.tipo_evento} - ${reserva.fecha}`,

      precio:
        normalizePrice(
          reserva.total
        ),
    };
  };

// ======================================================
// RESOLVER MESA
// ======================================================

const resolveMesa =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const reserva =
      await ReservaMesa.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "La reserva de mesa no existe"
      );
    }

    validateOwnership(
      reserva.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      reserva.estado
    );

    throw new AppError(
      422,
      "ITEM_PRICE_NOT_AVAILABLE",
      "La reserva de mesa todavía no tiene una tarifa configurada"
    );
  };

// ======================================================
// RESOLVER ACTIVIDAD
// ======================================================

const resolveActividad =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const reserva =
      await ReservaActividad.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "La reserva de actividad no existe"
      );
    }

    validateOwnership(
      reserva.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      reserva.estado
    );

    throw new AppError(
      422,
      "ITEM_PRICE_NOT_AVAILABLE",
      "La reserva de actividad todavía no tiene una tarifa configurada"
    );
  };

// ======================================================
// RESOLVER AMENIDAD
// ======================================================

const resolveAmenidad =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const reserva =
      await ReservaAmenidad.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "La reserva de amenidad no existe"
      );
    }

    validateOwnership(
      reserva.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      reserva.estado
    );

    throw new AppError(
      422,
      "ITEM_PRICE_NOT_AVAILABLE",
      "La reserva de amenidad todavía no tiene una tarifa configurada"
    );
  };

// ======================================================
// RESOLVER BIENESTAR
// ======================================================

const resolveBienestar =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const cita =
      await CitaBienestar.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!cita) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "La cita de bienestar no existe"
      );
    }

    validateOwnership(
      cita.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      cita.estado
    );

    const servicio =
      await ServicioBienestar.findByPk(
        cita.servicio_bienestar_id,
        {
          transaction,
        }
      );

    if (!servicio) {
      throw new AppError(
        404,
        "WELLNESS_SERVICE_NOT_FOUND",
        "El servicio asociado a la cita ya no existe"
      );
    }

    return {
      usuarioId:
        cita.usuario_id,

      descripcion:
        `${servicio.nombre} - ${cita.fecha} ${cita.hora_inicio}`,

      precio:
        normalizePrice(
          servicio.precio
        ),
    };
  };

// ======================================================
// RESOLVER BOLETO DE PARQUE
// ======================================================

const resolveBoletoParque =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const boleto =
      await BoletoParque.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!boleto) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "El boleto de parque no existe"
      );
    }

    validateOwnership(
      boleto.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      boleto.estado
    );

    return {
      usuarioId:
        boleto.usuario_id,

      descripcion:
        `Boleto ${boleto.tipo_boleto} - ${boleto.fecha_visita}`,

      precio:
        normalizePrice(
          boleto.precio
        ),
    };
  };

// ======================================================
// RESOLVER TRANSPORTE
// ======================================================

const resolveTransporte =
  async (
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    const reserva =
      await ReservaTransporte.findByPk(
        referenciaId,
        {
          transaction,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "CART_REFERENCE_NOT_FOUND",
        "La reserva de transporte no existe"
      );
    }

    validateOwnership(
      reserva.usuario_id,
      carritoUserId
    );

    validateReferenceState(
      reserva.estado
    );

    throw new AppError(
      422,
      "ITEM_PRICE_NOT_AVAILABLE",
      "La reserva de transporte todavía no tiene una tarifa configurada"
    );
  };

// ======================================================
// RESOLVER REFERENCIA GENÉRICA
// ======================================================

const resolveReference =
  async (
    tipoItem: CartItemType,
    referenciaId: number,
    carritoUserId: number,
    transaction?: any
  ): Promise<ResolvedItem> => {
    switch (
      tipoItem
    ) {
      case "habitacion":
        return resolveHabitacion(
          referenciaId,
          carritoUserId,
          transaction
        );

      case "evento":
        return resolveEvento(
          referenciaId,
          carritoUserId,
          transaction
        );

      case "mesa":
        return resolveMesa(
          referenciaId,
          carritoUserId,
          transaction
        );

      case "actividad":
        return resolveActividad(
          referenciaId,
          carritoUserId,
          transaction
        );

      case "amenidad":
        return resolveAmenidad(
          referenciaId,
          carritoUserId,
          transaction
        );

      case "bienestar":
        return resolveBienestar(
          referenciaId,
          carritoUserId,
          transaction
        );

      case "boleto_parque":
        return resolveBoletoParque(
          referenciaId,
          carritoUserId,
          transaction
        );

      case "transporte":
        return resolveTransporte(
          referenciaId,
          carritoUserId,
          transaction
        );

      default:
        throw new AppError(
          400,
          "INVALID_CART_ITEM_TYPE",
          "El tipo de ítem del carrito no es válido"
        );
    }
  };

// ======================================================
// LISTAR ÍTEMS
// ======================================================

export const getAll = async (
  carritoId: number,
  requesterId: number,
  requesterRole: Role
) => {
  /*
   * Esta comprobación ocurre fuera de transacción.
   * Así el cambio a "expirado" queda persistido.
   */
  await expireCartIfNeeded(
    carritoId
  );

  await getCartForAccess(
    carritoId,
    requesterId,
    requesterRole
  );

  const items =
    await CarritoItem.findAll({
      where: {
        carrito_id:
          carritoId,
      },

      include: [
        {
          model: Promocion,
          required: false,
        },
      ],

      order: [
        [
          "id",
          "ASC",
        ],
      ],
    });

  const total =
    items.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(
          item.precio
        ) *
          Number(
            item.cantidad
          ),
      0
    );

  return {
    items,

    total:
      Math.round(
        (
          total +
          Number.EPSILON
        ) * 100
      ) / 100,
  };
};

// ======================================================
// OBTENER ÍTEM POR ID
// ======================================================

export const getById = async (
  carritoId: number,
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  await expireCartIfNeeded(
    carritoId
  );

  await getCartForAccess(
    carritoId,
    requesterId,
    requesterRole
  );

  const item =
    await CarritoItem.findOne({
      where: {
        id,

        carrito_id:
          carritoId,
      },

      include: [
        {
          model: Promocion,
          required: false,
        },
      ],
    });

  if (!item) {
    throw new AppError(
      404,
      "CART_ITEM_NOT_FOUND",
      "El ítem solicitado no existe en este carrito"
    );
  }

  return item;
};

// ======================================================
// AGREGAR ÍTEM
// ======================================================

export const create = async (
  carritoId: number,

  data: {
    tipo_item:
      CartItemType;

    referencia_id:
      number;
  },

  requesterId: number,
  requesterRole: Role
) => {
  /*
   * IMPORTANTE:
   * expiramos fuera de la transacción.
   *
   * Si después getCartForAccess lanza
   * CART_NOT_ACTIVE, el UPDATE no se revierte.
   */
  await expireCartIfNeeded(
    carritoId
  );

  const itemId =
    await sequelize.transaction(
      async (
        transaction: any
      ) => {
        const carrito =
          await getCartForAccess(
            carritoId,
            requesterId,
            requesterRole,
            true,
            transaction,
            true
          );

        /*
         * La ruta ya limita POST a clientes,
         * pero también protegemos el Service.
         */
        if (
          carrito.usuario_id !==
          requesterId
        ) {
          throw new AppError(
            403,
            "INSUFFICIENT_PERMISSIONS",
            "Solo el propietario puede modificar su carrito"
          );
        }

        /*
         * No permitimos agregar la misma
         * referencia dos veces.
         */
        const existing =
          await CarritoItem.findOne({
            where: {
              carrito_id:
                carritoId,

              tipo_item:
                data.tipo_item,

              referencia_id:
                data.referencia_id,
            },

            transaction,
          });

        if (
          existing
        ) {
          throw new AppError(
            409,
            "CART_ITEM_ALREADY_EXISTS",
            "La referencia ya se encuentra agregada al carrito"
          );
        }

        /*
         * El precio y descripción salen
         * del backend, nunca del frontend.
         */
        const resolved =
          await resolveReference(
            data.tipo_item,
            data.referencia_id,
            carrito.usuario_id,
            transaction
          );

        const item =
          await CarritoItem.create(
            {
              carrito_id:
                carritoId,

              tipo_item:
                data.tipo_item,

              referencia_id:
                data.referencia_id,

              descripcion:
                resolved.descripcion,

              precio:
                resolved.precio,

              cantidad: 1,

              promocion_id:
                null,
            },

            {
              transaction,
            }
          );

        return item.id;
      }
    );

  return getById(
    carritoId,
    itemId,
    requesterId,
    requesterRole
  );
};

// ======================================================
// ELIMINAR ÍTEM
// ======================================================

export const remove = async (
  carritoId: number,
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  /*
   * Igual que create:
   * la expiración ocurre antes de la transacción.
   */
  await expireCartIfNeeded(
    carritoId
  );

  await sequelize.transaction(
    async (
      transaction: any
    ) => {
      const carrito =
        await getCartForAccess(
          carritoId,
          requesterId,
          requesterRole,
          true,
          transaction,
          true
        );

      if (
        carrito.usuario_id !==
        requesterId
      ) {
        throw new AppError(
          403,
          "INSUFFICIENT_PERMISSIONS",
          "Solo el propietario puede modificar su carrito"
        );
      }

      const item =
        await CarritoItem.findOne({
          where: {
            id,

            carrito_id:
              carritoId,
          },

          transaction,
        });

      if (!item) {
        throw new AppError(
          404,
          "CART_ITEM_NOT_FOUND",
          "El ítem solicitado no existe en este carrito"
        );
      }

      await item.destroy({
        transaction,
      });
    }
  );
};