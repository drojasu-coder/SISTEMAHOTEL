import type { CarritoItem, TipoItemCarrito } from './types';

/**
 * Textos de la pantalla del carrito y acciones de compra.
 *
 * Se mantienen dentro del módulo para no alterar las traducciones globales ni
 * compartir mensajes con otras pantallas. Todas las referencias monetarias son
 * presentación de valores calculados por el backend.
 */
export const textosCarrito = {
  subtitulo: 'HOTEL HUNAHPÚ',
  titulo: 'Su carrito',
  descripcion:
    'Revise los artículos agregados y el total calculado por el hotel.',
  carritoNumero: (id: number | string) => `Carrito #${id}`,
  articulos: (cantidad: number) =>
    cantidad === 1 ? '1 artículo' : `${cantidad} artículos`,

  reservar: 'Reservar habitación',
  irMisReservas: 'Ir a mis reservas',
  actualizar: 'Actualizar carrito',
  comprobarEstado: 'Comprobar estado',
  descartar: 'Descartar',
  reintentar: 'Reintentar',
  volverMisReservas: 'Volver a mis reservas',

  cargandoCarrito: 'Cargando su carrito…',
  cargandoArticulos: 'Cargando los artículos de su carrito…',

  sinCarritoTitulo: 'No tiene un carrito activo',
  sinCarritoDescripcion:
    'Cuando agregue una reserva de habitación, aparecerá aquí con su importe.',
  carritoVacioTitulo: 'Su carrito está vacío',
  carritoVacioDescripcion: 'Todavía no hay artículos en este carrito.',
  carritoNoDisponibleTitulo: 'Su carrito ya no está disponible',
  carritoNoDisponibleDescripcion:
    'El carrito venció o dejó de estar activo. No se ha creado un carrito nuevo.',

  errorCarritoTitulo: 'No fue posible cargar su carrito',
  errorArticulosTitulo: 'No fue posible cargar los artículos',
  errorAccesoTitulo: 'No tiene acceso a este carrito',
  errorAccesoDescripcion:
    'Este carrito no pertenece a su cuenta o ya no está disponible para consulta.',
  errorConexionTitulo: 'No fue posible conectar con el servidor',
  errorConexionDescripcion:
    'Verifique su conexión e inténtelo de nuevo.',

  campos: {
    tipo: 'Tipo de artículo',
    precio: 'Precio unitario',
    cantidad: 'Cantidad',
    referencia: 'Referencia',
    total: 'Total del carrito',
  },
  articuloNumero: (id: number | string) => `Artículo #${id}`,
  referenciaNumero: (id: number | string) => `Referencia #${id}`,
  verReserva: (id: number | string) => `Ver reserva #${id}`,
  tipoOtro: 'Otro artículo',
  sinDescripcion: (id: number | string) =>
    `Artículo #${id} sin descripción`,
  noDisponible: 'No disponible',
  notaTotal:
    'Importe calculado por el hotel. No representa un pago realizado.',
  notaHabitacion: 'Retirar del carrito no cancela la reserva.',
  notaCarrito: 'Puede continuar al checkout para pagar con Stripe.',

  retirar: 'Retirar',
  retirarArticulo: (id: number | string) => `Retirar artículo #${id}`,
  confirmarTitulo: 'Retirar artículo del carrito',
  confirmarDescripcion: (descripcion: string) =>
    `¿Desea retirar "${descripcion}" del carrito?`,
  confirmarHabitacion:
    'Retirar esta habitación del carrito no cancela su reserva. Consulte su estado en Mis reservas.',
  confirmarOtro:
    'El artículo se quitará únicamente de este carrito. No se elimina el registro asociado en su cuenta.',
  cancelar: 'Cancelar',
  confirmarRetirar: 'Retirar del carrito',

  retiroExito: 'Se retiró el artículo del carrito.',
  retiroArticuloAusente:
    'El artículo ya no estaba en el carrito. Actualizamos la lista.',
  retiroCarritoVencido:
    'El carrito ya no está activo. Actualizamos su estado; no se ha creado un carrito nuevo.',
  retiroSinAcceso:
    'No fue posible retirar el artículo porque el carrito no está disponible para su cuenta. Actualizamos su estado.',
  retiroRed:
    'No pudimos confirmar si el artículo se retiró. Actualizamos el carrito para mostrar su estado real. Revise la lista antes de intentarlo de nuevo.',
  retiroError:
    'No fue posible retirar el artículo. Actualizamos el carrito para mostrar su estado actual.',

  // Acciones de adición al carrito
  anadirAlCarrito: 'Añadir al carrito',
  anadiendoAlCarrito: 'Añadiendo al carrito…',
  anadirExito: 'Se añadió la reserva al carrito activo.',
  anadirExitoNota: 'Añadir al carrito no constituye pago ni confirmación de la reserva.',
  verCarrito: 'Ver carrito',
  irAlCarrito: 'Ir al carrito',
  referenciaPagada: 'Pagado',
  referenciaPagoParcial: 'Esta reserva ya tiene un pago registrado y no puede añadirse a otro carrito.',
  referenciaProcesando: 'Hay un pago en proceso para esta reserva. Espere su confirmación antes de intentar otro cobro.',
  referenciaEnCarrito: 'Esta reserva ya está en su carrito.',
  referenciaAnticipo: 'Anticipo pagado',
  referenciaPagoParcialEtiqueta: 'Pago parcial registrado',
  referenciaProcesandoEtiqueta: 'Pago en proceso',
  montoPagado: 'Pagado',
  montoEnProceso: 'En proceso',
  saldoPendiente: 'Saldo pendiente',
  yaEnCarrito: 'Esta reserva ya se encuentra en su carrito activo.',
  referenciaNoDisponible: 'La reserva seleccionada ya no se encuentra disponible para compra.',
  referenciaAjena: 'La reserva seleccionada no pertenece a su cuenta.',
  carritoInactivo: 'Su carrito anterior venció. Inténtelo de nuevo para iniciar uno nuevo.',
  errorRedAnadir:
    'No fue posible confirmar si la reserva se añadió al carrito debido a un fallo de conexión. Revise su carrito antes de reintentar.',
  errorAnadirGenerico: 'No fue posible añadir la reserva al carrito.',
  noElegibleEstado: 'Esta reserva no está disponible para añadir al carrito en su estado actual.',

  acceso: {
    verificandoSesion: 'Verificando su sesión…',
    errorSesionTitulo: 'No fue posible verificar su sesión',
    errorSesionDescripcion: 'Revise su conexión e inténtelo de nuevo.',
    sinSesionTitulo: 'Inicie sesión para ver su carrito',
    sinSesionDescripcion:
      'Para consultar los artículos de su carrito, ingrese con su cuenta de cliente.',
    iniciarSesion: 'Iniciar sesión',
    rolTitulo: 'Esta sección es para clientes',
    rolDescripcion:
      'Su cuenta no tiene el rol de cliente, por lo que no puede consultar un carrito en esta sección.',
    irMiEspacio: 'Ir a mi espacio',
    irInicio: 'Ir al inicio',
    reintentar: 'Reintentar',
    volver: 'Volver',
  },
} as const;

const ETIQUETAS_TIPO: Record<TipoItemCarrito, string> = {
  habitacion: 'Habitación',
  evento: 'Evento',
  mesa: 'Mesa',
  actividad: 'Actividad',
  amenidad: 'Amenidad',
  bienestar: 'Bienestar',
  boleto_parque: 'Boleto de parque',
  transporte: 'Transporte',
};

/**
 * Presenta un importe en quetzales con dos decimales (Q1,234.00).
 *
 * No calcula ni modifica el valor: si el backend no entrega un monto válido,
 * se muestra un texto explícito en lugar de inventar una cifra.
 */
export function formatearGTQ(
  valor: number | string | null | undefined,
): string {
  if (valor === null || valor === undefined || valor === '') {
    return textosCarrito.noDisponible;
  }

  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero)) {
    return textosCarrito.noDisponible;
  }

  return `Q${numero.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Presenta la cantidad registrada por el servidor sin alterarla. */
export function formatearCantidad(valor: number): string {
  return Number.isFinite(valor) && valor >= 0
    ? String(valor)
    : textosCarrito.noDisponible;
}

/** Etiqueta legible del tipo de artículo; nunca asume que se trata de una habitación. */
export function etiquetaTipoItem(tipo: string): string {
  return ETIQUETAS_TIPO[tipo as TipoItemCarrito] ?? textosCarrito.tipoOtro;
}

/**
 * Descripción del artículo registrada por el backend. Si no existe, se usa un
 * identificador claro en lugar de inventar un nombre.
 */
export function descripcionItem(
  item: Pick<CarritoItem, 'id' | 'descripcion'>,
): string {
  const descripcion = item.descripcion?.trim();
  return descripcion ? descripcion : textosCarrito.sinDescripcion(item.id);
}

/** Solo los artículos de tipo habitación enlazan a una reserva de habitación. */
export function esItemHabitacion(
  item: Pick<CarritoItem, 'tipo_item'>,
): boolean {
  return item.tipo_item === 'habitacion';
}
