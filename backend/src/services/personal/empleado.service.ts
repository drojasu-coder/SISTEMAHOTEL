import { Transaction, UniqueConstraintError } from "sequelize";
import { create as createUsuario, CreateUsuarioData } from "../usuarios/usuario.service";
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
  usuario_id?: number;
  cuenta?: CreateUsuarioData;
  sucursal_id: number;
  area: string;
  fecha_contratacion?: string | null;
  sedes_adicionales?: number[];
}

interface UpdateEmpleadoData {
  sucursal_id?: number;
  area?: string;
  fecha_contratacion?: string | null;
  sedes_adicionales?: number[];
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

  if (Number.isNaN(fechaContratacion.getTime()) || fechaContratacion.getFullYear() !== Number(fecha.slice(0, 4)) || fechaContratacion.getMonth() + 1 !== Number(fecha.slice(5, 7)) || fechaContratacion.getDate() !== Number(fecha.slice(8, 10))) {
    throw new AppError(422, "INVALID_HIRE_DATE", "La fecha de contratación no es válida");
  }

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
  usuarioId: number,
  transaction: Transaction
) => {
  const usuario =
    await Usuario.findByPk(
      usuarioId, { transaction, lock: transaction.LOCK.UPDATE }
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
    ![ROLES.GERENTE_HABITACIONES, ROLES.RECEPCIONISTA, ROLES.EMPLEADO_OPERATIVO, ROLES.GERENTE_RESTAURANTE].includes(usuario.rol)
  ) {
    throw new AppError(
      422,
      "CLIENT_CANNOT_BE_EMPLOYEE",
      "Solo se pueden vincular cuentas de personal; administrador y cliente no son elegibles"
    );
  }

  const existingEmpleado =
    await Empleado.findOne({
      transaction,
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
  async (where: Record<string | symbol, unknown> = {}) => {
    return Empleado.findAll({
    where,
      include: [
        { model: db.EmpleadoSede, as: "sedesAdicionales", attributes: ["sucursal_id"] },
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
        { model: db.EmpleadoSede, as: "sedesAdicionales", attributes: ["sucursal_id"] },
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

// User and territory assignment remain exclusive to the general administrator router.
const validateAdditionalSites = async (ids: number[], principal: number) => {
  if (new Set(ids).size !== ids.length || ids.includes(principal)) throw new AppError(422, "INVALID_EMPLOYEE_SITES", "No repita la sede principal ni las sedes adicionales");
  for (const id of ids) await validateSucursal(id);
};
export const create = async (data: CreateEmpleadoData) => {
  if (Boolean(data.usuario_id) === Boolean(data.cuenta)) throw new AppError(400, "INVALID_EMPLOYEE_ACCOUNT", "Indique una cuenta nueva o una existente");
  await validateSucursal(data.sucursal_id);
  validateFechaContratacion(data.fecha_contratacion);
  const { sedes_adicionales = [], cuenta, usuario_id, ...fields } = data;
  await validateAdditionalSites(sedes_adicionales, data.sucursal_id);
  const id = await db.sequelize.transaction(async (transaction: Transaction) => {
    // Lock existing accounts before checking their ficha to serialize simultaneous links.
    const usuario = cuenta
      ? await createUsuario(cuenta, transaction)
      : await validateUsuario(usuario_id!, transaction);
    if (![ROLES.GERENTE_HABITACIONES, ROLES.RECEPCIONISTA, ROLES.EMPLEADO_OPERATIVO, ROLES.GERENTE_RESTAURANTE].includes(usuario.rol)) {
      throw new AppError(422, "INVALID_EMPLOYEE_ROLE", "Seleccione un rol de personal");
    }
    // La restricción UNIQUE(usuario_id) es la garantía final: si otra petición simultánea
    // vinculó la misma cuenta, se responde con el mismo error claro que la comprobación previa.
    const employee = await Empleado.create({ ...fields, usuario_id: usuario.id, fecha_contratacion: fields.fecha_contratacion ?? null }, { transaction })
      .catch((error: unknown) => {
        if (error instanceof UniqueConstraintError && error.errors.some((item) => item.path === "usuario_id")) {
          throw new AppError(409, "USER_ALREADY_HAS_EMPLOYEE_PROFILE", "La cuenta ya está vinculada a una ficha de empleado");
        }
        throw error;
      });
    if (sedes_adicionales.length) await db.EmpleadoSede.bulkCreate(sedes_adicionales.map(sucursal_id => ({ empleado_id: employee.id, sucursal_id })), { transaction });
    return employee.id;
  });
  return getById(id);
};
export const update = async (id: number, data: UpdateEmpleadoData) => {
  await db.sequelize.transaction(async (transaction: any) => {
    const employee = await Empleado.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!employee) throw new AppError(404, "EMPLOYEE_NOT_FOUND", "El empleado solicitado no existe");
    const principal = data.sucursal_id ?? employee.sucursal_id;
    if (data.sucursal_id !== undefined) await validateSucursal(principal);
    validateFechaContratacion(data.fecha_contratacion);
    const { sedes_adicionales, ...fields } = data;
    if (sedes_adicionales !== undefined) await validateAdditionalSites(sedes_adicionales, principal);
    await employee.update(fields, { transaction });
    if (sedes_adicionales !== undefined) {
      await db.EmpleadoSede.destroy({ where: { empleado_id: id }, transaction });
      await db.EmpleadoSede.bulkCreate(sedes_adicionales.map(sucursal_id => ({ empleado_id: id, sucursal_id })), { transaction });
    } else if (data.sucursal_id !== undefined) {
      await db.EmpleadoSede.destroy({ where: { empleado_id: id, sucursal_id: principal }, transaction });
    }
  });
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

