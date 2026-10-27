import type { CarritoItem, TipoItemCarrito } from "@/features/carrito/types";
import type { EstadoPago } from "./types";

export function formatGTQ(monto: number | string | null | undefined): string {
  if (monto === null || monto === undefined || monto === '') return 'Q0.00';
  const num = typeof monto === 'number' ? monto : parseFloat(String(monto));
  if (Number.isNaN(num)) return 'Q0.00';
  return `Q${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const textosPagos = {
  // Encabezados
  tituloPagina: 'Resultado del pago',
  subtituloPagina: 'Estado de la transacción verificado con HOTEL HUNAHPÚ.',

  // Estados del pago
  estados: {
    pendiente: 'Pendiente de confirmación',
    procesando: 'Procesando transacción',
    aprobado: 'Pago aprobado',
    rechazado: 'Pago rechazado',
    cancelado: 'Pago cancelado',
    reembolsado: 'Pago reembolsado',
    reembolsado_parcial: 'Pago reembolsado parcialmente',
  } as Record<EstadoPago, string>,

  // Mensajes por estado
  mensajeAprobado: 'Su pago ha sido procesado y confirmado con éxito por el hotel.',
  mensajeProcesando:
    'Estamos verificando su transacción. Esta pantalla consulta el estado durante un tiempo limitado; puede regresar para comprobarlo.',
  mensajeRechazado:
    'El servidor informa que el pago fue rechazado. Revise su detalle antes de intentar otro pago.',
  mensajeCancelado:
    'Este intento de pago ha sido cancelado o ha expirado sin completarse.',
  mensajeReembolsado:
    'El servidor registra una devolución para este pago.',

  // Detalles
  detalleTitulo: 'Detalle de la transacción',
  codigoPago: 'Identificador del pago:',
  monto: 'Monto total:',
  metodo: 'Método utilizado:',
  estado: 'Estado actual:',
  referenciaExterna: 'Referencia de pasarela:',
  fecha: 'Fecha de pago:',
  origenCarrito: (id: number) => `Carrito #${id}`,
  origenReserva: (id: number) => `Reserva #${id}`,

  // Acciones y Navegación
  botonRegresarCheckout: 'Regresar al checkout',
  botonMisReservas: 'Ir a Mis reservas',
  botonVerReserva: 'Ver detalle de la reserva',
  botonReintentar: 'Reintentar consulta',
  botonIniciarSesion: 'Iniciar sesión',

  // Avisos y Errores
  avisoPollingActivo:
    'Verificando el estado de la transacción en tiempo real...',
  idInvalidoTitulo: 'Identificador no válido',
  idInvalidoMensaje:
    'El identificador de pago especificado en la dirección no es válido.',
  errorCargaTitulo: 'No fue posible consultar el pago',
  errorCargaMensaje:
    'Ocurrió un problema al consultar el estado de la transacción con el servidor.',
  accesoRestringidoTitulo: 'Acceso restringido',
  accesoRestringidoMensaje:
    'Esta pantalla está reservada exclusivamente para que los clientes consulten el estado de sus pagos.',
};


/**
 * Textos de la pantalla de checkout y del intento de pago.
 *
 * Se mantienen dentro del módulo para no alterar las traducciones globales.
 * Los importes siempre se presentan tal como los devuelve el servidor; ninguna
 * función de este archivo suma precios ni calcula saldos.
 */
export const textosCheckout = {
  subtitulo: 'HOTEL HUNAHPÚ',
  titulo: 'Finalizar pago',
  descripcion:
    'Revise los artículos y el resumen calculado por el hotel antes de pagar con tarjeta.',
  carritoNumero: (id: number | string) => `Carrito #${id}`,
  articulos: (cantidad: number) =>
    cantidad === 1 ? '1 artículo' : `${cantidad} artículos`,
  volverCarrito: 'Volver al carrito',
  volverInicio: 'Volver al inicio',
  irMisReservas: 'Ir a mis reservas',
  reservar: 'Reservar habitación',
  verResultado: 'Ver resultado del pago',
  comprobarEstado: 'Comprobar estado',
  reintentar: 'Reintentar',
  actualizar: 'Actualizar',
  descartar: 'Descartar aviso',

  cargandoCarrito: 'Cargando su carrito…',
  cargandoArticulos: 'Cargando los artículos de su carrito…',
  cargandoResumen: 'Consultando el resumen de pago…',
  cargandoIntento: 'Consultando el estado de su pago…',

  sinCarritoTitulo: 'No tiene un carrito activo',
  sinCarritoDescripcion:
    'Agregue una reserva o servicio al carrito para continuar con el pago. No se ha creado un carrito nuevo.',
  carritoVacioTitulo: 'Su carrito está vacío',
  carritoVacioDescripcion:
    'Todavía no hay artículos en este carrito. Agregue una reserva para continuar.',
  carritoNoDisponibleTitulo: 'Su carrito ya no está disponible',
  carritoNoDisponibleDescripcion:
    'El carrito venció o dejó de estar activo. Actualice su estado; no se ha creado un carrito nuevo.',

  resumen: {
    titulo: 'Resumen de pago',
    total: 'Total del carrito',
    anticipo: 'Anticipo requerido',
    aprobado: 'Monto aprobado',
    saldo: 'Saldo pendiente',
    nota:
      'Importes calculados por el hotel. Este resumen no representa un pago realizado.',
    notaSaldo:
      'El saldo pendiente es el importe que el servidor permite pagar en este momento.',
  },

  articulosLista: {
    titulo: 'Artículos del carrito',
    precio: 'Precio unitario',
    cantidad: 'Cantidad',
    referencia: 'Referencia',
  },

  pago: {
    titulo: 'Pago con tarjeta',
    descripcion:
      'El pago se procesa con Stripe. Confirme los datos de su tarjeta únicamente cuando esté listo.',
    preparar: 'Continuar al pago',
    preparando: 'Preparando el pago…',
    crearIntento:
      'Se creará un intento de pago por el saldo pendiente. No se realizará ningún cobro hasta que confirme su tarjeta.',
    importe: 'Importe a pagar',
    formularioDescripcion:
      'Ingrese los datos de su tarjeta y confirme el pago. El hotel verificará el resultado antes de marcarlo como aprobado.',
    confirmar: 'Confirmar pago',
    confirmando: 'Confirmando pago…',
    tarjetaNoDisponible:
      'El pago con tarjeta no está disponible en este momento. Compruebe el estado del pago antes de reintentar.',
    noSaldoTitulo: 'No tiene saldo pendiente',
    noSaldoDescripcion:
      'El servidor indica que el carrito no tiene un saldo pendiente. No es necesario realizar otro pago.',
    sinArticulos:
      'No hay artículos para pagar en este carrito.',
    intentoSinDatos:
      'El servidor creó el intento de pago, pero no devolvió los datos necesarios para confirmarlo. No se ha realizado ningún cobro.',
    intentoIncompleto:
      'El intento de pago no está disponible para confirmación. Actualice su estado antes de intentarlo de nuevo.',
  },

  estados: {
    procesandoTitulo: 'Su pago está en proceso',
    procesandoDescripcion:
      'El hotel está verificando el resultado con la pasarela. No realice otro pago mientras este intento siga en proceso.',
    completadoTitulo: 'Pago recibido, confirmación pendiente',
    completadoDescripcion:
      'La pasarela completó el intento. El hotel todavía debe confirmar el pago antes de marcarlo como aprobado.',
    canceladoTitulo: 'El intento de pago fue cancelado',
    canceladoDescripcion:
      'El intento anterior ya no puede confirmarse. No se realizará un nuevo cobro automáticamente.',
    exitoTitulo: 'Pago aprobado',
    exitoDescripcion:
      'El servidor confirmó el pago. Puede consultar el resultado y el estado de su carrito.',
    rechazadoTitulo: 'El pago no fue aprobado',
    rechazadoDescripcion:
      'La pasarela o el hotel rechazaron el pago. No se realizará otro cobro automáticamente.',
    confirmacionEnviada:
      'Recibimos la confirmación de la tarjeta. El hotel todavía debe verificar el pago; no lo consideramos aprobado hasta que el servidor lo confirme.',
    verificando:
      'Estamos consultando el estado real del pago. Puede regresar para comprobarlo; no inicie otro cobro mientras el resultado sea incierto.',
  },

  errores: {
    carrito:
      'No fue posible cargar su carrito. Verifique su conexión e inténtelo de nuevo.',
    articulos:
      'No fue posible cargar los artículos de su carrito. No se ha realizado ningún cobro.',
    resumen:
      'No fue posible cargar el resumen de pago. No se ha realizado ningún cobro.',
    recuperacionTitulo: 'No fue posible consultar el estado de su pago',
    recuperacionDescripcion:
      'No pudimos recuperar el intento activo ni su estado en la pasarela. Por seguridad, no se habilitará otro cobro. Actualice el estado para continuar.',
    conexion:
      'No fue posible conectar con el servidor. No se ha realizado ningún cobro; actualice el estado antes de reintentar.',
    montoDifiereTitulo: 'El importe del intento no coincide con el saldo actual',
    montoDifiereDescripcion:
      'El saldo del carrito cambió después de crear el intento. No confirme este pago ni genere otro intento automáticamente. Actualice el estado para revisar la situación.',
    intentoMonto: (monto: string) => `Importe del intento: ${monto}`,
    saldoActual: (monto: string) => `Saldo vigente: ${monto}`,
    conflictoTitulo: 'Otra operación modificó el saldo',
    conflictoDescripcion:
      'El servidor rechazó el intento porque el saldo cambió mientras se procesaba la solicitud. Actualizamos el intento y el resumen. No se ha realizado un nuevo cobro ni se generó otra clave automáticamente.',
    conflictoSinIntento:
      'No se encontró un intento activo después de la actualización. Por seguridad, no se habilitará otro cobro en esta pantalla.',
    idempotenciaTitulo: 'El intento guardado ya no coincide con el carrito',
    idempotenciaDescripcion:
      'La clave de idempotencia guardada pertenece a un importe anterior. No se envió un nuevo cobro y no se generó otra clave automáticamente. Actualice el estado o vuelva al carrito.',
    crear:
      'No fue posible preparar el pago. No se ha realizado ningún cobro. Actualice el estado antes de reintentar.',
    crearRed:
      'No pudimos confirmar si el intento de pago se creó. No se ha realizado ningún cobro nuevo. Compruebe el estado antes de reintentar.',
    tarjetaRechazada:
      'No fue posible confirmar el pago con la tarjeta. Revise los datos o use otra tarjeta en este mismo intento.',
    confirmacionIncierta:
      'No pudimos confirmar el resultado de la tarjeta. No repita el cobro todavía: actualice el estado para comprobar si el pago fue enviado.',
    pagoNoDisponible:
      'El intento de pago no está disponible para confirmación. Actualice su estado antes de intentarlo de nuevo.',
    estadoPago:
      'No fue posible consultar el estado del pago. No se habilitará otro cobro hasta que el servidor responda.',
    acceso:
      'Este carrito no pertenece a su cuenta o ya no está disponible para pago.',
    sinSesion: 'Inicie sesión para continuar con el pago.',
    rol: 'Esta sección es para clientes.',
  },

  acceso: {
    verificandoSesion: 'Verificando su sesión…',
    errorSesionTitulo: 'No fue posible verificar su sesión',
    errorSesionDescripcion: 'Revise su conexión e inténtelo de nuevo.',
    sinSesionTitulo: 'Inicie sesión para finalizar el pago',
    sinSesionDescripcion:
      'Para pagar el contenido de su carrito, ingrese con su cuenta de cliente.',
    iniciarSesion: 'Iniciar sesión',
    rolTitulo: 'Esta sección es para clientes',
    rolDescripcion:
      'Su cuenta no tiene el rol de cliente, por lo que no puede finalizar un pago en esta sección.',
    irMiEspacio: 'Ir a mi espacio',
    irInicio: 'Ir al inicio',
    reintentar: 'Reintentar',
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

const TIPO_DESCONOCIDO = 'Otro artículo';

/**
 * Presenta un importe en quetzales con dos decimales (Q1,234.00).
 *
 * No calcula ni modifica el valor: si el servidor no entrega un monto válido,
 * se muestra un texto explícito en lugar de inventar una cifra.
 */
export function formatearGTQ(
  valor: number | string | null | undefined,
): string {
  if (valor === null || valor === undefined || valor === '') {
    return 'No disponible';
  }

  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero)) {
    return 'No disponible';
  }

  return `Q${numero.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Etiqueta legible del tipo de artículo; nunca asume que es una habitación. */
export function etiquetaTipoItem(tipo: string): string {
  return ETIQUETAS_TIPO[tipo as TipoItemCarrito] ?? TIPO_DESCONOCIDO;
}

/**
 * Descripción registrada por el servidor. Si falta, se usa el identificador
 * del artículo en lugar de inventar un nombre.
 */
export function descripcionItem(
  item: Pick<CarritoItem, 'id' | 'descripcion'>,
): string {
  const descripcion = item.descripcion?.trim();
  return descripcion
    ? descripcion
    : `Artículo #${item.id} sin descripción`;
}

