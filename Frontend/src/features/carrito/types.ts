import type { components } from '@/api/generated/schema';

type Schemas = components['schemas'];

/**
 * Constantes y tipos de estado para el ciclo de vida del carrito.
 */
export const ESTADOS_CARRITO = ['activo', 'expirado', 'pagado'] as const;
export type EstadoCarrito = Schemas['Carrito']['estado'];

/**
 * Tipos de ítems admitidos por el backend para adición al carrito.
 */
export const TIPOS_ITEM_CARRITO = [
  'habitacion',
  'evento',
  'mesa',
  'actividad',
  'amenidad',
  'bienestar',
  'boleto_parque',
  'transporte',
] as const;
export type TipoItemCarrito = Schemas['CarritoItem']['tipo_item'];

/**
 * Modelos canónicos derivados del contrato OpenAPI generado (BE-013).
 */
export type Carrito = Schemas['Carrito'];
export type CarritoItem = Schemas['CarritoItem'];
export type CarritoItemsData = Schemas['CarritoItemsData'];
export type CreateCarritoItemInput = Schemas['CreateCarritoItemRequest'];

/**
 * Envoltorios estándar de respuesta HTTP del backend.
 */
export type CarritoResponse = Schemas['CarritoResponse'];
export type CarritosResponse = Schemas['CarritosResponse'];
export type CarritoItemsResponse = Schemas['CarritoItemsResponse'];
export type CarritoItemResponse = Schemas['CarritoItemResponse'];
