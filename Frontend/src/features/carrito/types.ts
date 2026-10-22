/**
 * Tipos de transporte y modelos para el dominio del carrito de compras.
 *
 * Contratos verificados contra:
 * - backend/src/models/carrito.js
 * - backend/src/models/carritoitem.js
 * - backend/src/validators/carrito/carritoItem.validator.ts
 * - backend/src/controllers/carrito/carrito.controller.ts
 * - backend/src/controllers/carrito/carritoItem.controller.ts
 * - backend/src/services/carrito/carrito.service.ts
 * - backend/src/services/carrito/carritoItem.service.ts
 */

export const ESTADOS_CARRITO = ['activo', 'expirado', 'pagado'] as const;
export type EstadoCarrito = (typeof ESTADOS_CARRITO)[number];

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
export type TipoItemCarrito = (typeof TIPOS_ITEM_CARRITO)[number];

/**
 * Entidad de Carrito en el sistema.
 */
export interface Carrito {
  id: number;
  usuario_id: number;
  estado: EstadoCarrito;
  expira_en: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ítem individual dentro de un carrito.
 */
export interface CarritoItem {
  id: number;
  carrito_id: number;
  tipo_item: TipoItemCarrito;
  referencia_id: number;
  descripcion: string | null;
  precio: number | string;
  cantidad: number;
  promocion_id: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos del listado de ítems de un carrito con total calculado por el servidor.
 */
export interface CarritoItemsData {
  items: CarritoItem[];
  total: number;
}

/**
 * Payload para añadir un ítem al carrito activo.
 * El servidor determina descripción, precio y cantidad.
 */
export interface CreateCarritoItemInput {
  tipo_item: TipoItemCarrito;
  referencia_id: number;
}

// Envoltorios estándar de la API REST
export interface CarritoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Carrito;
}

export interface CarritoItemsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CarritoItemsData;
}

export interface CarritoItemResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CarritoItem;
}
