import { Op } from "sequelize";

import { AppError }
  from "../../utils/AppError";

const db = require("../../models");

const {
  sequelize,
  Turno,
  Empleado,
} = db;

interface CreateTurnoData {
  empleado_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

interface UpdateTurnoData {
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
}

const addDays = (
  fecha: string,
  days: number
): string => {
  const [
    year,
    month,
    day,
  ] = fecha
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day + days
    )
  );

  return date
    .toISOString()
    .slice(0, 10);
};

const toMilliseconds = (
  fecha: string,
  hora: string
): number => {
  const [
    year,
    month,
    day,
  ] = fecha
    .split("-")
    .map(Number);

  const [
    hour,
    minute,
    second = 0,
  ] = hora
    .split(":")
    .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );
};

const getTurnoRange = (
  fecha: string,
  horaInicio: string,
  horaFin: string
) => {
  const inicio =
    toMilliseconds(
      fecha,
      horaInicio
    );

  let fin =
    toMilliseconds(
      fecha,
      horaFin
    );

  // Si termina antes de comenzar,
  // interpretamos que termina al día siguiente.
  if (fin < inicio) {
    fin +=
      24 * 60 * 60 * 1000;
  }

  return {
    inicio,
    fin,
  };
};

const validateTimeRange = (
  horaInicio: string,
  horaFin: string
) => {
  if (
    horaInicio === horaFin
  ) {
    throw new AppError(
      422,
      "INVALID_SHIFT_TIME_RANGE",
      "La hora de inicio y la hora de finalización no pueden ser iguales"
    );
  }
};

const getEmpleadoForShift = async (
  empleadoId: number,
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

  const empleado =
    await Empleado.findByPk(
      empleadoId,
      options
    );

  if (!empleado) {
    throw new AppError(
      404,
      "EMPLOYEE_NOT_FOUND",
      "El empleado indicado no existe"
    );
  }

  return empleado;
};

const validateAvailability =
  async (
    empleadoId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    transaction: any,
    excludeTurnoId?: number
  ) => {
    const fechaAnterior =
      addDays(fecha, -1);

    const fechaSiguiente =
      addDays(fecha, 1);

    const where: any = {
      empleado_id:
        empleadoId,

      fecha: {
        [Op.between]: [
          fechaAnterior,
          fechaSiguiente,
        ],
      },
    };

    if (
      excludeTurnoId !==
      undefined
    ) {
      where.id = {
        [Op.ne]:
          excludeTurnoId,
      };
    }

    const existentes =
      await Turno.findAll({
        where,
        transaction,
      });

    const candidato =
      getTurnoRange(
        fecha,
        horaInicio,
        horaFin
      );

    for (
      const turno of existentes
    ) {
      const existente =
        getTurnoRange(
          turno.fecha,
          turno.hora_inicio,
          turno.hora_fin
        );

      const hayTraslape =
        candidato.inicio <
          existente.fin &&
        candidato.fin >
          existente.inicio;

      if (hayTraslape) {
        throw new AppError(
          409,
          "EMPLOYEE_SHIFT_CONFLICT",
          "El empleado ya tiene un turno asignado en ese horario"
        );
      }
    }
  };

  export const getAll =
  async () => {
    return Turno.findAll({
      include: [
        {
          model: Empleado,
          attributes: [
            "id",
            "usuario_id",
            "sucursal_id",
            "area",
          ],
        },
      ],

      order: [
        ["fecha", "ASC"],
        ["hora_inicio", "ASC"],
      ],
    });
  };

export const getById = async (
  id: number
) => {
  const turno =
    await Turno.findByPk(
      id,
      {
        include: [
          {
            model: Empleado,
            attributes: [
              "id",
              "usuario_id",
              "sucursal_id",
              "area",
            ],
          },
        ],
      }
    );

  if (!turno) {
    throw new AppError(
      404,
      "SHIFT_NOT_FOUND",
      "El turno solicitado no existe"
    );
  }

  return turno;
};

export const create = async (
  data: CreateTurnoData
) => {
  const turnoId =
    await sequelize.transaction(
      async (
        transaction: any
      ) => {
        validateTimeRange(
          data.hora_inicio,
          data.hora_fin
        );

        await getEmpleadoForShift(
          data.empleado_id,
          transaction,
          true
        );

        await validateAvailability(
          data.empleado_id,
          data.fecha,
          data.hora_inicio,
          data.hora_fin,
          transaction
        );

        const turno =
          await Turno.create(
            data,
            {
              transaction,
            }
          );

        return turno.id;
      }
    );

  return getById(
    turnoId
  );
};

export const update = async (
  id: number,
  data: UpdateTurnoData
) => {
  await sequelize.transaction(
    async (
      transaction: any
    ) => {
      const turno =
        await Turno.findByPk(
          id,
          {
            transaction,
            lock:
              transaction.LOCK.UPDATE,
          }
        );

      if (!turno) {
        throw new AppError(
          404,
          "SHIFT_NOT_FOUND",
          "El turno solicitado no existe"
        );
      }

      await getEmpleadoForShift(
        turno.empleado_id,
        transaction,
        true
      );

      const fecha =
        data.fecha ??
        turno.fecha;

      const horaInicio =
        data.hora_inicio ??
        turno.hora_inicio;

      const horaFin =
        data.hora_fin ??
        turno.hora_fin;

      validateTimeRange(
        horaInicio,
        horaFin
      );

      await validateAvailability(
        turno.empleado_id,
        fecha,
        horaInicio,
        horaFin,
        transaction,
        id
      );

      await turno.update(
        {
          fecha,
          hora_inicio:
            horaInicio,
          hora_fin:
            horaFin,
        },
        {
          transaction,
        }
      );
    }
  );

  return getById(id);
};

export const remove = async (
  id: number
) => {
  const turno =
    await Turno.findByPk(id);

  if (!turno) {
    throw new AppError(
      404,
      "SHIFT_NOT_FOUND",
      "El turno solicitado no existe"
    );
  }

  await turno.destroy();
};