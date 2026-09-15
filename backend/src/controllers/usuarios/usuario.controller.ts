import {
  Request,
  Response,
} from "express";

import * as usuarioService
  from "../../services/usuarios/usuario.service";

export const getAll = async (
  _req: Request,
  res: Response
) => {
  const usuarios =
    await usuarioService.getAll();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Usuarios obtenidos correctamente",
    data: usuarios,
  });
};

export const getById = async (
  req: Request,
  res: Response
) => {
  const usuario =
    await usuarioService.getById(
      Number(req.params.id)
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Usuario obtenido correctamente",
    data: usuario,
  });
};

export const create = async (
  req: Request,
  res: Response
) => {
  const usuario =
    await usuarioService.create(
      req.body
    );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message:
      "Usuario creado correctamente",
    data: usuario,
  });
};

export const update = async (
  req: Request,
  res: Response
) => {
  const usuario =
    await usuarioService.update(
      Number(req.params.id),
      req.body
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Usuario actualizado correctamente",
    data: usuario,
  });
};

export const updateRole = async (
  req: Request,
  res: Response
) => {
  const usuario =
    await usuarioService.updateRole(
      Number(req.params.id),
      req.body.rol,
      req.user!.id
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Rol del usuario actualizado correctamente",
    data: usuario,
  });
};

export const updateStatus = async (
  req: Request,
  res: Response
) => {
  const usuario =
    await usuarioService.updateStatus(
      Number(req.params.id),
      req.body.activo,
      req.user!.id
    );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "Estado del usuario actualizado correctamente",
    data: usuario,
  });
};