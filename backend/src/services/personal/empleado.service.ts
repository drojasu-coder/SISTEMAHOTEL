import { AppError }
  from "../../utils/AppError";

import { ROLES }
  from "../../constants/roles";

const db = require("../../models");

const {
  Empleado,
  Usuario,
  Sucursal,
  Turno,
} = db;

interface CreateEmpleadoData {
  usuario_id: number;
  sucursal_id: number;
  area: string;
  fecha_contratacion?: string | null;
}

interface UpdateEmpleadoData {
  sucursal_id?: number;
  area?: string;
  fecha_contratacion?: string | null;
}

const validateFechaContratacion = (
  fecha?: string | null
) => {
  if (!fecha) {
    return;
  }

  const hoy = new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  const fechaContratacion =
    new Date(
      `${fecha}T00:00:00`
    );

  if (
    fechaContratacion >
    hoy
  ) {
    throw new AppError(
      422,
      "EMPLOYEE_HIRE_DATE_IN_FUTURE",
      "La fecha de contratación no puede estar en el futuro"
    );
  }
};

const validateUsuario = async (
  usuarioId: number
) => {
  const usuario =
    await Usuario.findByPk(
      usuarioId
    );

  if (!usuario) {
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      "El usuario indicado no existe"
    );
  }

  if (!usuario.activo) {
    throw new AppError(
      422,
      "USER_INACTIVE",
      "No se puede crear un empleado con una cuenta deshabilitada"
    );
  }

  if (
    usuario.rol ===
    ROLES.CLIENTE
  ) {
    throw new AppError(
      422,
      "CLIENT_CANNOT_BE_EMPLOYEE",
      "Un usuario con rol cliente no puede asignarse como empleado"
    );
  }

  const existingEmpleado =
    await Empleado.findOne({
      where: {
        usuario_id:
          usuarioId,
      },
    });

  if (existingEmpleado) {
    throw new AppError(
      409,
      "USER_ALREADY_HAS_EMPLOYEE_PROFILE",
      "El usuario ya se encuentra asociado a un empleado"
    );
  }

  return usuario;
};

const validateSucursal = async (
  sucursalId: number
) => {
  const sucursal =
    await Sucursal.findByPk(
      sucursalId
    );

  if (!sucursal) {
    throw new AppError(
      404,
      "BRANCH_NOT_FOUND",
      "La sucursal indicada no existe"
    );
  }

  if (!sucursal.activa) {
    throw new AppError(
      422,
      "BRANCH_INACTIVE",
      "No se puede asignar un empleado a una sucursal inactiva"
    );
  }

  return sucursal;
};

export const getAll =
  async () => {
    return Empleado.findAll({
      include: [
        {
          model: Usuario,
          attributes: [
            "id",
            "nombre",
            "email",
            "rol",
            "telefono",
            "activo",
          ],
        },

        {
          model: Sucursal,
          attributes: [
            "id",
            "nombre",
            "ciudad",
            "activa",
          ],
        },
      ],

      order: [["id", "ASC"]],
    });
  };

  export const getById = async (
  id: number
) => {
  const empleado =
    await Empleado.findByPk(
      id,
      {
        include: [
          {
            model: Usuario,
            attributes: [
              "id",
              "nombre",
              "email",
              "rol",
              "telefono",
              "activo",
            ],
          },

          {
            model: Sucursal,
            attributes: [
              "id",
              "nombre",
              "ciudad",
              "activa",
            ],
          },
        ],
      }
    );

  if (!empleado) {
    throw new AppError(
      404,
      "EMPLOYEE_NOT_FOUND",
      "El empleado solicitado no existe"
    );
  }

  return empleado;
};

export const create = async (
  data: CreateEmpleadoData
) => {
  await validateUsuario(
    data.usuario_id
  );

  await validateSucursal(
    data.sucursal_id
  );

  validateFechaContratacion(
    data.fecha_contratacion
  );

  const empleado =
    await Empleado.create({
      usuario_id:
        data.usuario_id,

      sucursal_id:
        data.sucursal_id,

      area:
        data.area,

      fecha_contratacion:
        data.fecha_contratacion ??
        null,
    });

  return getById(
    empleado.id
  );
};

export const update = async (
  id: number,
  data: UpdateEmpleadoData
) => {
  const empleado =
    await Empleado.findByPk(
      id
    );

  if (!empleado) {
    throw new AppError(
      404,
      "EMPLOYEE_NOT_FOUND",
      "El empleado solicitado no existe"
    );
  }

  if (
    data.sucursal_id !==
    undefined
  ) {
    await validateSucursal(
      data.sucursal_id
    );
  }

  if (
    data.fecha_contratacion !==
    undefined
  ) {
    validateFechaContratacion(
      data.fecha_contratacion
    );
  }

  await empleado.update(
    data
  );

  return getById(id);
};

export const remove = async (
  id: number
) => {
  const empleado =
    await Empleado.findByPk(
      id
    );

  if (!empleado) {
    throw new AppError(
      404,
      "EMPLOYEE_NOT_FOUND",
      "El empleado solicitado no existe"
    );
  }

  const turnos =
    await Turno.count({
      where: {
        empleado_id: id,
      },
    });

  if (turnos > 0) {
    throw new AppError(
      409,
      "EMPLOYEE_HAS_SHIFTS",
      "El empleado no puede eliminarse porque tiene turnos asociados"
    );
  }

  await empleado.destroy();
};

