import { Request, Response } from "express";

import * as authService from "../services/auth.service";

export const register = async (
  req: Request,
  res: Response
) => {
  const usuario = await authService.register(
    req.body
  );

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "Usuario registrado correctamente",
    data: usuario,
  });
};

export const login = async (
  req: Request,
  res: Response
) => {
  const result = await authService.login(
    req.body
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Inicio de sesión exitoso",
    data: result,
  });
};

export const me = async (
  req: Request,
  res: Response
) =>{
  const usuario = await authService.getCurrentUser(
    req.user!.id
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Usuario autenticado",
    data: usuario,
  });
};