import { describe, it, expect, vi, beforeEach } from 'vitest';
import { carritoApi } from './carritoApi';
import { api, ApiError } from '@/api/client/http';
import type { Carrito, CarritoResponse } from '../types';

describe('carritoApi.getOrCreateActiveCart', () => {
  const mockCarrito: Carrito = {
    id: 42,
    usuario_id: 10,
    estado: 'activo',
    expira_en: '2026-10-22T14:00:00.000Z',
    createdAt: '2026-10-22T12:00:00.000Z',
    updatedAt: '2026-10-22T12:00:00.000Z',
  };

  const mockResponse: CarritoResponse = {
    success: true,
    statusCode: 200,
    message: 'Carrito activo obtenido',
    data: mockCarrito,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna el carrito actual si ya existe uno activo sin intentar crearlo', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse);
    const postSpy = vi.spyOn(api, 'post');

    const result = await carritoApi.getOrCreateActiveCart();

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledWith('/carritos/actual');
    expect(postSpy).not.toHaveBeenCalled();
    expect(result).toEqual(mockCarrito);
  });

  it('crea un carrito nuevo cuando getCurrent devuelve 404 (inexistente o vencido)', async () => {
    const notFoundError = new ApiError(404, 'Carrito no encontrado o inactivo', {
      code: 'ACTIVE_CART_NOT_FOUND',
    });

    vi.spyOn(api, 'get').mockRejectedValueOnce(notFoundError);
    vi.spyOn(api, 'post').mockResolvedValueOnce(mockResponse);

    const result = await carritoApi.getOrCreateActiveCart();

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/carritos', {});
    expect(result).toEqual(mockCarrito);
  });

  it('maneja la carrera concurrente: si POST devuelve 409 CART_ALREADY_ACTIVE, re-consulta el carrito actual', async () => {
    const notFoundError = new ApiError(404, 'Carrito no encontrado o inactivo', {
      code: 'ACTIVE_CART_NOT_FOUND',
    });
    const conflictError = new ApiError(409, 'El usuario ya tiene un carrito activo', {
      code: 'CART_ALREADY_ACTIVE',
    });

    const getSpy = vi
      .spyOn(api, 'get')
      .mockRejectedValueOnce(notFoundError) // 1er intento: 404
      .mockResolvedValueOnce(mockResponse); // Re-consulta tras conflicto: éxito

    const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce(conflictError);

    const result = await carritoApi.getOrCreateActiveCart();

    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockCarrito);
  });

  it('no convierte otros errores 409 no relacionados en éxito', async () => {
    const notFoundError = new ApiError(404, 'Carrito no encontrado o inactivo');
    const genericConflict = new ApiError(409, 'Conflicto genérico de recurso', {
      code: 'DUPLICATE_RESOURCE',
    });

    vi.spyOn(api, 'get').mockRejectedValueOnce(notFoundError);
    vi.spyOn(api, 'post').mockRejectedValueOnce(genericConflict);

    await expect(carritoApi.getOrCreateActiveCart()).rejects.toThrow(genericConflict);
  });

  it('lanza inmediatamente errores que no sean 404 en la consulta inicial sin intentar POST', async () => {
    const serverError = new ApiError(500, 'Error interno del servidor');
    vi.spyOn(api, 'get').mockRejectedValueOnce(serverError);
    const postSpy = vi.spyOn(api, 'post');

    await expect(carritoApi.getOrCreateActiveCart()).rejects.toThrow(serverError);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('no reintenta escrituras automáticamente ante errores de red', async () => {
    const notFoundError = new ApiError(404, 'Carrito no encontrado o inactivo');
    const networkError = new TypeError('Failed to fetch');

    vi.spyOn(api, 'get').mockRejectedValueOnce(notFoundError);
    vi.spyOn(api, 'post').mockRejectedValueOnce(networkError);

    await expect(carritoApi.getOrCreateActiveCart()).rejects.toThrow(networkError);
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
