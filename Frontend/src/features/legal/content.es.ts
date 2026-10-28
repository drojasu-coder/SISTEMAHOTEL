import type { LegalDocuments } from './types';

/**
 * Contenido legal en español. Cada afirmación describe el comportamiento real
 * del sistema (backend y frontend) o una norma guatemalteca verificada; lo que
 * no está determinado se declara como pendiente en lugar de inventarse.
 */
export const legalEs: LegalDocuments = {
  terminos: {
    title: 'Términos y condiciones',
    description:
      'Condiciones de uso de la plataforma de HOTEL HUNAHPÚ: cuentas, reservas, precios, pagos y límites del servicio.',
    sections: [
      {
        id: 'naturaleza',
        title: 'Naturaleza del sitio',
        blocks: [
          { p: 'HOTEL HUNAHPÚ es un proyecto universitario de gestión hotelera. El sitio demuestra el funcionamiento de un sistema de reservas, pagos y administración para un hotel con sedes en Guatemala.' },
          { p: 'HOTEL HUNAHPÚ no es una sociedad mercantil inscrita ni un establecimiento de hospedaje registrado ante el Instituto Guatemalteco de Turismo (INGUAT). Las reservas, los servicios y los importes que se muestran tienen fines académicos y no constituyen una oferta comercial real de hospedaje, alimentación ni otros servicios.' },
        ],
      },
      {
        id: 'alcance',
        title: 'Alcance de estos términos',
        blocks: [
          { p: 'Estos términos describen cómo funciona la plataforma y qué se espera de quienes la utilizan. Complementan la Política de privacidad, la Política de reservas, cancelaciones y reembolsos y la Política de almacenamiento en el navegador.' },
          { p: 'El sistema no registra una aceptación expresa de estos términos: no existe una casilla de aceptación ni un registro de la fecha en que fueron leídos. Nada de lo aquí indicado limita los derechos que el Decreto 6-2003 del Congreso, Ley de Protección al Consumidor y Usuario, reconoce a consumidores y usuarios.' },
        ],
      },
      {
        id: 'cuentas',
        title: 'Registro, inicio de sesión y credenciales',
        blocks: [
          { p: 'Para reservar es necesario crear una cuenta de cliente con nombre, correo electrónico y contraseña; el teléfono es opcional.' },
          { list: [
            'La contraseña debe tener entre 8 y 72 caracteres e incluir al menos una mayúscula, una minúscula y un número.',
            'El sistema no verifica la titularidad del correo electrónico durante el registro.',
            'La sesión dura como máximo una hora. Se conserva mientras la pestaña esté abierta y se comparte con otras pestañas del mismo sitio abiertas en el navegador; al cerrar sesión en una de ellas, se cierra en todas.',
            'Tras varios intentos fallidos, el servidor limita temporalmente nuevos intentos de inicio de sesión.',
          ] },
          { p: 'Usted es responsable de mantener la confidencialidad de su contraseña y de cerrar la sesión en equipos compartidos. Si sospecha un uso no autorizado de su cuenta, comuníquelo mediante los datos de contacto publicados en el sitio.' },
        ],
      },
      {
        id: 'uso',
        title: 'Uso permitido',
        blocks: [
          { p: 'La plataforma debe usarse para consultar los catálogos y gestionar reservas propias. No está permitido:' },
          { list: [
            'Acceder o intentar acceder a cuentas, reservas o pagos de otras personas.',
            'Introducir datos falsos de terceros o suplantar a otra persona.',
            'Realizar solicitudes automatizadas que alteren el funcionamiento del servicio o eludan los controles de acceso.',
            'Usar las funciones administrativas sin la autorización correspondiente a su rol.',
          ] },
          { p: 'El personal del hotel accede solo a las funciones de su rol y, cuando corresponde, únicamente a la información de las sedes que tiene asignadas.' },
        ],
      },
      {
        id: 'reservas',
        title: 'Requisitos para reservar y confirmaciones',
        blocks: [
          { list: [
            'Habitaciones: se indican sede, fechas de llegada y salida y número de huéspedes, sin superar la capacidad del tipo de habitación. Consultar disponibilidad no aparta la habitación; la disponibilidad se comprueba de nuevo al crear la reserva. La reserva se crea en estado «pendiente» y pasa a «confirmada» cuando su total queda cubierto por pagos aprobados, o cuando el personal la confirma.',
            'Restaurante, actividades, bienestar y amenidades: la reserva se registra en estado «confirmada» cuando el sistema valida horario, cupo y reglas del servicio. Ese estado es operativo: no acredita por sí mismo que exista un pago.',
            'Eventos: la solicitud se registra como «cotización». No aparta el salón ni genera un cobro inmediato. El personal administrativo es quien la confirma.',
          ] },
          { p: 'Las fechas y horarios se interpretan en la hora de Guatemala.' },
        ],
      },
      {
        id: 'precios-pagos',
        title: 'Precios y pagos',
        blocks: [
          { list: [
            'Los precios se expresan en quetzales (GTQ) e incluyen los impuestos aplicables. Al hospedaje se le aplica además la tasa de turismo del INGUAT; a los demás servicios, solo el IVA.',
            'El importe en dólares (USD) es una referencia calculada a Q7.80 por US$1.00. Los pagos se procesan siempre en quetzales.',
            'El total de una reserva de habitación se calcula con la tarifa vigente al crearla o al cambiar sus fechas o su habitación. Si la tarifa del catálogo cambia después, el importe registrado no se recalcula.',
            'Para eventos se calcula un anticipo del 30 % del total de la cotización (tarifa base del salón más servicios adicionales). El saldo solo puede pagarse después de cubrir el anticipo.',
            'Los pagos en línea se hacen con tarjeta a través de Stripe. La plataforma opera con Stripe en modo de prueba: no se realizan cargos reales y deben utilizarse los datos de prueba que indica Stripe.',
            'Una transferencia queda pendiente hasta que el personal autorizado la aprueba. Los pagos en efectivo solo puede registrarlos el personal.',
            'Un carrito de compra vence a los 15 minutos. Si vence antes de pagar, es necesario iniciar un nuevo carrito.',
          ] },
          { p: 'El sistema genera registros internos de factura. Esos registros no son documentos tributarios electrónicos certificados por la Superintendencia de Administración Tributaria (SAT).' },
        ],
      },
      {
        id: 'cancelaciones',
        title: 'Cancelaciones y modificaciones',
        blocks: [
          { p: 'Las reglas de cada servicio se detallan en la Política de reservas, cancelaciones y reembolsos. En resumen, solo las cotizaciones y reservas de eventos pueden cancelarse directamente desde la cuenta del cliente; las demás reservas las modifica o cancela el personal del hotel. Ningún reembolso es automático.' },
        ],
      },
      {
        id: 'limitaciones',
        title: 'Limitaciones del servicio',
        blocks: [
          { list: [
            'La información de sedes, habitaciones, menús, actividades, servicios y salones es demostrativa y puede cambiar sin aviso.',
            'El sistema no envía confirmaciones por correo electrónico ni mensajes de texto: el estado de cada reserva se consulta en la sección «Mis reservas».',
            'La disponibilidad del sitio puede interrumpirse por mantenimiento o fallas técnicas.',
          ] },
        ],
      },
      {
        id: 'ley-aplicable',
        title: 'Normativa de referencia y quejas',
        blocks: [
          { p: 'Se toman como referencia las leyes de la República de Guatemala, en particular el Decreto 6-2003 del Congreso (Ley de Protección al Consumidor y Usuario) y el Acuerdo Gubernativo 1144-83 (Reglamento para Establecimientos de Hospedaje del INGUAT).' },
          { p: 'Un establecimiento real debe poner a disposición del público un libro de quejas autorizado (artículo 17 del Decreto 6-2003 y artículo 103 del Acuerdo Gubernativo 1144-83). Este proyecto no cuenta con libro de quejas autorizado; las consultas y reclamos se canalizan por los datos de contacto publicados en el sitio.' },
        ],
      },
      {
        id: 'cambios',
        title: 'Cambios a estos términos',
        blocks: [
          { p: 'Estos términos pueden actualizarse cuando cambie el funcionamiento de la plataforma. La fecha de la última actualización aparece al inicio de esta página.' },
        ],
      },
    ],
  },

  privacidad: {
    title: 'Política de privacidad',
    description:
      'Qué datos personales recopila la plataforma, para qué se usan, dónde se procesan y quién puede consultarlos.',
    sections: [
      {
        id: 'responsable',
        title: 'Responsable y marco normativo',
        blocks: [
          { p: 'La plataforma es un proyecto universitario de gestión hotelera y no está operada por una entidad legal registrada. Las consultas sobre esta política se atienden mediante los datos de contacto publicados en el sitio.' },
          { p: 'Guatemala no cuenta todavía con una ley integral de protección de datos personales aplicable al sector privado; las iniciativas presentadas al Congreso aún no han sido aprobadas. Esta política no afirma cumplir normas extranjeras, como el Reglamento General de Protección de Datos de la Unión Europea.' },
        ],
      },
      {
        id: 'datos',
        title: 'Datos que se almacenan',
        blocks: [
          { list: [
            'Cuenta: nombre, correo electrónico, teléfono (opcional), rol, estado activo o inactivo y fechas de creación y actualización. La contraseña no se guarda en texto legible: se almacena su resumen criptográfico (bcrypt).',
            'Reservas de habitación: sede y habitación, fechas de llegada y salida, número de huéspedes, estado e importe total.',
            'Restaurante: mesa, fecha, hora, número de comensales y estado.',
            'Actividades: recurso, instructor (si se eligió), fecha, horario, participantes, equipo, estado e importe.',
            'Bienestar: servicio, terapeuta, fecha, horario y estado de la cita.',
            'Amenidades: amenidad, fecha, franja horaria, mobiliario solicitado, código QR y estado.',
            'Eventos: salón, tipo de evento, fecha, horario, número de invitados, servicios adicionales, total, anticipo y estado.',
            'Carrito y pagos: artículos del carrito, importe, moneda, método, tipo de pago (total, anticipo o saldo), estado, fecha, identificador del intento de pago de Stripe, clave de idempotencia y, si ocurre, código y mensaje de error. Los reembolsos registran importe, motivo, estado e identificador externo.',
            'Facturas: NIT, nombre y dirección fiscales y desglose de importes e impuestos.',
            'Personal del hotel: además de la cuenta, sede principal, sedes adicionales autorizadas, área y fecha de contratación.',
          ] },
          { p: 'La plataforma no almacena el número completo de la tarjeta, la fecha de vencimiento ni el código de seguridad. Esos datos se escriben en el formulario de pago de Stripe y no pasan por los servidores del proyecto.' },
        ],
      },
      {
        id: 'finalidades',
        title: 'Para qué se usan',
        blocks: [
          { list: [
            'Autenticar a cada persona y aplicar los permisos de su rol.',
            'Crear, consultar y gestionar reservas, cotizaciones y pagos.',
            'Calcular importes, anticipos y saldos, y registrar facturas internas y reembolsos.',
            'Permitir que el personal autorizado atienda las reservas de las sedes que tiene asignadas.',
            'Diagnosticar errores y proteger el servicio frente a usos indebidos.',
          ] },
          { p: 'Los datos no se utilizan para publicidad, perfiles comerciales ni decisiones automatizadas, y no se venden a terceros.' },
        ],
      },
      {
        id: 'proveedores',
        title: 'Dónde se procesan',
        blocks: [
          { list: [
            'PostgreSQL: base de datos donde se guardan cuentas, reservas, pagos y facturas.',
            'Stripe: procesa los pagos con tarjeta en modo de prueba. La plataforma le envía el importe, la moneda y referencias internas (identificadores de pago, carrito o reserva y tipo de pago); no le envía su nombre ni su correo.',
            'Amazon Web Services (S3): almacena las imágenes de los catálogos (sedes, habitaciones, menús y servicios). Los clientes no suben imágenes.',
            'Google Fonts: el sitio carga sus tipografías desde servidores de Google, por lo que el navegador les envía datos técnicos de la conexión, como la dirección IP.',
          ] },
        ],
      },
      {
        id: 'acceso',
        title: 'Quién puede consultar la información',
        blocks: [
          { list: [
            'Cada cliente consulta únicamente sus propias reservas, pagos y facturas.',
            'El personal accede según su rol: el administrador general a todas las sedes; recepción y gerencias, solo a la información administrativa de las sedes que tienen asignadas.',
            'Los reembolsos y la aprobación de transferencias quedan reservados a roles administrativos autorizados.',
          ] },
        ],
      },
      {
        id: 'seguridad',
        title: 'Medidas de seguridad',
        blocks: [
          { list: [
            'Contraseñas almacenadas con resumen criptográfico (bcrypt).',
            'Sesiones con un token de acceso que vence a la hora y se guarda en el almacenamiento de la pestaña, no en cookies.',
            'Permisos verificados en el servidor para cada solicitud, por rol y por sede.',
            'Límite de intentos de inicio de sesión.',
            'Los registros técnicos del servidor anotan la ruta, el método, el resultado y la duración de cada solicitud, y omiten contraseñas, tokens y datos de tarjeta.',
          ] },
          { p: 'Ninguna medida elimina por completo el riesgo. La plataforma no declara certificaciones de seguridad.' },
        ],
      },
      {
        id: 'conservacion',
        title: 'Conservación',
        blocks: [
          { p: 'No existen plazos de eliminación automática. Las reservas canceladas se conservan como historial y los registros se mantienen mientras el proyecto esté activo.' },
        ],
      },
      {
        id: 'derechos',
        title: 'Consultas y solicitudes',
        blocks: [
          { p: 'Puede revisar sus datos de cuenta en «Mi cuenta» y sus reservas en «Mis reservas». La plataforma no ofrece todavía funciones para corregir o eliminar la cuenta por cuenta propia. Las solicitudes de corrección o eliminación se dirigen a los datos de contacto publicados y se atienden manualmente, sin un plazo de respuesta garantizado.' },
        ],
      },
      {
        id: 'cambios',
        title: 'Cambios a esta política',
        blocks: [
          { p: 'Esta política se actualizará si cambian los datos tratados o los proveedores utilizados. La fecha de la última actualización aparece al inicio de esta página.' },
        ],
      },
    ],
  },

  reservas: {
    title: 'Reservas, cancelaciones y reembolsos',
    description:
      'Cómo funcionan los estados de cada reserva, quién puede cancelarla y cómo se tramita un reembolso, servicio por servicio.',
    sections: [
      {
        id: 'principios',
        title: 'Principios generales',
        blocks: [
          { list: [
            'Pendiente: la reserva existe, pero todavía no está confirmada (habitaciones).',
            'Confirmada: la reserva es válida para la fecha indicada. En restaurante, actividades, bienestar y amenidades es un estado operativo que no acredita un pago.',
            'Cotización: solicitud de evento que todavía no aparta el salón.',
            'Cancelada: la reserva deja de estar vigente, pero se conserva como historial.',
          ] },
          { p: 'Cancelar una reserva y reembolsar un pago son operaciones distintas. Cancelar cambia el estado de la reserva; un reembolso solo existe cuando el personal autorizado lo registra sobre un pago aprobado. Ningún reembolso se genera automáticamente al cancelar.' },
          { p: 'El sistema no aplica plazos, penalizaciones ni cargos por cancelación tardía o por no presentarse.' },
        ],
      },
      {
        id: 'habitaciones',
        title: 'Habitaciones',
        blocks: [
          { list: [
            'La reserva se crea en estado «pendiente» y pasa a «confirmada» cuando sus pagos aprobados cubren el total, o cuando la confirma el personal.',
            'El cliente no puede cancelarla por sí mismo desde la plataforma. Para cancelarla o cambiarla debe solicitarlo al hotel; el personal autorizado de la sede la cancela o modifica.',
            'No se puede cancelar ni modificar una reserva mientras uno de sus pagos está en procesamiento. Tampoco se puede reducir su total por debajo de lo ya pagado.',
            'Cancelar no genera un reembolso automático. El reembolso se tramita por separado, como se describe más abajo.',
          ] },
          { p: 'Referencia normativa (INGUAT): el Acuerdo Gubernativo 1144-83 permite pedir arras (un anticipo) para formalizar una reserva (artículo 96). Si el huésped cancela, el establecimiento debe devolver las arras y puede retener el 30 % si cancela con más de 30 días de anticipación, el 50 % si lo hace con más de 7 días y la totalidad de las arras con 7 días o menos (artículo 98). Si el incumplimiento es del establecimiento, debe devolver las arras más otra cantidad igual (artículo 97). El sistema no calcula estas retenciones ni exige arras para habitaciones: cobra el total. Cómo aplicarlas es una decisión pendiente (ver «Aspectos pendientes»).' },
          { p: 'El derecho de ocupación de la habitación, salvo disposición distinta aprobada por el INGUAT, empieza a las 13:00 horas de un día y vence a las 13:00 horas del día siguiente (artículo 89). La plataforma registra fechas de llegada y salida, pero no horas de entrada y salida.' },
        ],
      },
      {
        id: 'restaurante',
        title: 'Restaurante',
        blocks: [
          { list: [
            'La reserva de mesa se registra como «confirmada» y no requiere un pago en línea.',
            'El cliente no puede cancelarla desde la plataforma; el personal administrativo cancela o reactiva la reserva. Para reactivarla se comprueba de nuevo que la mesa esté libre y en servicio.',
          ] },
        ],
      },
      {
        id: 'actividades',
        title: 'Actividades y experiencias',
        blocks: [
          { list: [
            'La reserva calcula su importe con la tarifa por hora del recurso y, si se elige, la del instructor, multiplicadas por la duración (entre 30 minutos y 2 horas).',
            'El equipo con tarifa no se ofrece en línea porque no tiene una unidad de cobro definida; el equipo sin cargo puede solicitarse.',
            'El cliente no puede cancelar desde la plataforma; el personal administrativo cambia el estado a cancelada o completada.',
          ] },
        ],
      },
      {
        id: 'bienestar',
        title: 'Bienestar',
        blocks: [
          { list: [
            'La cita se registra como «confirmada» con un terapeuta y un horario disponibles. Ese estado no acredita un pago; el pago se gestiona en el carrito y el checkout.',
            'El cliente no puede cancelar desde la plataforma; el personal administrativo cambia el estado a cancelada o completada.',
          ] },
        ],
      },
      {
        id: 'amenidades',
        title: 'Amenidades',
        blocks: [
          { list: [
            'La reserva de una amenidad se registra para una fecha y una franja horaria, y genera un código QR. Las amenidades no tienen una tarifa configurada, por lo que no se cobran en línea.',
            'El cliente no puede cancelarla desde la plataforma; el personal administrativo la marca como usada o cancelada.',
          ] },
        ],
      },
      {
        id: 'eventos',
        title: 'Eventos y cotizaciones',
        blocks: [
          { list: [
            'La solicitud se registra como «cotización», sin apartar el salón ni generar cobros. El total suma la tarifa base del salón y los servicios adicionales; el anticipo requerido es el 30 % del total.',
            'El personal administrativo confirma, cancela o finaliza el evento.',
            'El cliente puede cancelar su propia cotización o reserva desde «Mis reservas» siempre que no tenga pagos aprobados ni pagos en procesamiento. Una reserva vencida no puede cancelarse.',
            'Si ya existe un pago aprobado, la cancelación y cualquier devolución deben solicitarse al hotel.',
          ] },
        ],
      },
      {
        id: 'reembolsos',
        title: 'Cómo se tramita un reembolso',
        blocks: [
          { list: [
            'Solicitud: el cliente la presenta por los datos de contacto publicados. La plataforma no tiene un formulario de solicitud de reembolso.',
            'Revisión: solo los roles administrativos autorizados pueden registrar un reembolso. Puede ser total o parcial, y nunca superior al monto aprobado disponible.',
            'Procesamiento: si el pago se hizo con tarjeta, el reembolso se envía a Stripe y su estado (pendiente, aprobado o rechazado) depende de la respuesta de Stripe. En modo de prueba no se devuelve dinero real. En pagos registrados manualmente, el reembolso deja constancia en el sistema, pero la devolución del dinero ocurre fuera de la plataforma.',
            'Resultado: el pago queda como «reembolsado» o «reembolsado parcialmente».',
          ] },
          { p: 'La plataforma no garantiza un reembolso ni un plazo de acreditación. Los tiempos dependen del emisor de la tarjeta y del medio de pago.' },
        ],
      },
      {
        id: 'retracto',
        title: 'Derecho de retracto',
        blocks: [
          { p: 'El artículo 51 del Decreto 6-2003 reconoce al consumidor el derecho a retractarse dentro de un plazo no mayor de cinco días hábiles cuando el contrato se celebra fuera del establecimiento comercial, con restitución de lo pagado siempre que no haya hecho uso del servicio. La plataforma no tiene un proceso automatizado para ejercerlo: debe solicitarse por los datos de contacto y lo tramita manualmente el personal.' },
        ],
      },
      {
        id: 'pendientes',
        title: 'Aspectos pendientes de decisión',
        blocks: [
          { p: 'Antes de que la plataforma pudiera operar con clientes reales, quedarían por resolver estos puntos. Requieren una decisión comercial o una revisión legal:' },
          { list: [
            'Cómo aplicar a las habitaciones el régimen de arras y las retenciones del artículo 98 del Acuerdo Gubernativo 1144-83, dado que el sistema cobra el total y no calcula retenciones.',
            'Plazos y canal formal para solicitar cancelaciones, reembolsos y el derecho de retracto.',
            'Horas de entrada y salida autorizadas por el INGUAT, y tarifas aprobadas por esa institución.',
            'Registro del contrato de adhesión ante la Dirección de Atención y Asistencia al Consumidor (artículo 52 del Decreto 6-2003) y libro de quejas autorizado.',
            'Emisión de facturas electrónicas certificadas ante la SAT.',
          ] },
        ],
      },
    ],
  },

  almacenamiento: {
    title: 'Cookies y almacenamiento en el navegador',
    description:
      'Qué guarda el sitio en su navegador, para qué sirve y por qué no se muestra un aviso de consentimiento de cookies.',
    sections: [
      {
        id: 'resumen',
        title: 'Resumen',
        blocks: [
          { p: 'El sitio no crea cookies propias y no utiliza herramientas de analítica, publicidad ni seguimiento. Usa el almacenamiento del navegador (sessionStorage y localStorage) solo para funciones necesarias y preferencias que usted elige. Por eso no muestra un aviso de consentimiento de cookies.' },
        ],
      },
      {
        id: 'session',
        title: 'Almacenamiento de la pestaña (sessionStorage)',
        blocks: [
          { p: 'Se borra al cerrar la pestaña. Contiene:' },
          { list: [
            'El token de acceso de la sesión (vence a la hora y se elimina al cerrar sesión).',
            'Borradores de búsqueda y de reserva (criterios de estancia, selección de habitación y datos de servicios en curso), para no perderlos durante el inicio de sesión.',
            'Datos técnicos del intento de pago en curso, para evitar cobros duplicados si recarga la página.',
            'Para el personal, la sede seleccionada en el panel administrativo. Esta preferencia no otorga permisos: los permisos los verifica el servidor.',
          ] },
        ],
      },
      {
        id: 'local',
        title: 'Preferencias del sitio (localStorage)',
        blocks: [
          { p: 'Se conservan hasta que usted las cambie o borre los datos del sitio en su navegador:' },
          { list: [
            'Idioma (español o inglés).',
            'Moneda de visualización (GTQ o la referencia en USD).',
            'Sede seleccionada para explorar el catálogo público.',
          ] },
        ],
      },
      {
        id: 'pestanas',
        title: 'Comunicación entre pestañas',
        blocks: [
          { p: 'El sitio utiliza BroadcastChannel, una función del navegador que comunica pestañas del mismo sitio dentro del mismo navegador. Se usa para que una pestaña nueva reciba la sesión ya iniciada y para cerrar la sesión en todas las pestañas a la vez. La información no sale de su navegador por este medio y el servidor valida siempre la sesión recibida.' },
        ],
      },
      {
        id: 'terceros',
        title: 'Servicios de terceros',
        blocks: [
          { list: [
            'Stripe: el formulario de pago se carga desde Stripe solo en el checkout. Stripe puede usar sus propias cookies y tecnologías similares, por ejemplo para prevenir el fraude. Esas tecnologías dependen de Stripe y se rigen por su política de privacidad, no por esta página.',
            'Google Fonts: las tipografías se descargan desde servidores de Google, que reciben datos técnicos de la conexión.',
            'Amazon Web Services: las imágenes de los catálogos se sirven mediante enlaces temporales de Amazon S3.',
          ] },
        ],
      },
      {
        id: 'control',
        title: 'Cómo controlarlo',
        blocks: [
          { p: 'Puede borrar el almacenamiento del sitio desde la configuración de su navegador. Si lo hace, se cerrará la sesión y se perderán los borradores y las preferencias, pero no se modifican las reservas ni los pagos guardados en el servidor.' },
        ],
      },
    ],
  },

  preguntas: {
    title: 'Preguntas frecuentes',
    description: 'Respuestas breves sobre cuentas, reservas, pagos y cancelaciones en HOTEL HUNAHPÚ.',
    sections: [
      { id: 'real', title: '¿Es un hotel real?', blocks: [{ p: 'No. Es un proyecto universitario que demuestra un sistema de gestión hotelera. Las reservas y los pagos tienen fines académicos y Stripe opera en modo de prueba, sin cargos reales.' }] },
      { id: 'cuenta', title: '¿Necesito una cuenta para reservar?', blocks: [{ p: 'Sí. Puede consultar los catálogos sin iniciar sesión, pero para reservar necesita una cuenta de cliente. El sistema conserva su búsqueda mientras inicia sesión o se registra.' }] },
      { id: 'disponibilidad', title: '¿Consultar disponibilidad aparta la habitación?', blocks: [{ p: 'No. La disponibilidad se comprueba de nuevo al crear la reserva. Si otra persona reserva antes, el sistema se lo indicará.' }] },
      { id: 'confirmada', title: '¿Cuándo queda confirmada mi reserva de habitación?', blocks: [{ p: 'Cuando los pagos aprobados cubren el total, o cuando el personal del hotel la confirma. Mientras tanto aparece como «pendiente».' }] },
      { id: 'estado-confirmado', title: 'Mi cita de bienestar dice «confirmada». ¿Ya está pagada?', blocks: [{ p: 'No necesariamente. En restaurante, actividades, bienestar y amenidades, «confirmada» es un estado operativo. El estado del pago se consulta en el carrito y el checkout.' }] },
      { id: 'moneda', title: '¿En qué moneda pago?', blocks: [{ p: 'En quetzales (GTQ). El importe en dólares es una referencia calculada a Q7.80 por US$1.00.' }] },
      { id: 'tarjeta', title: '¿Guardan los datos de mi tarjeta?', blocks: [{ p: 'No. Los datos de la tarjeta se escriben en el formulario de Stripe y no pasan por los servidores del proyecto. Solo se guarda el resultado y la referencia del pago.' }] },
      { id: 'cancelar', title: '¿Cómo cancelo una reserva?', blocks: [{ p: 'Las cotizaciones y reservas de eventos sin pagos aprobados ni en procesamiento pueden cancelarse desde «Mis reservas». Para las demás reservas, solicite la cancelación al hotel; la realiza el personal autorizado.' }] },
      { id: 'reembolso', title: '¿Recibo un reembolso automático si cancelo?', blocks: [{ p: 'No. Cancelar no genera un reembolso. Los reembolsos los revisa y registra el personal autorizado, sin superar el monto pagado. Consulte la Política de reservas, cancelaciones y reembolsos.' }] },
      { id: 'carrito', title: '¿Por qué venció mi carrito?', blocks: [{ p: 'El carrito vence a los 15 minutos. Si vence antes de completar el pago, inicie uno nuevo y vuelva a añadir sus reservas.' }] },
      { id: 'tarifa', title: '¿Por qué el total de mi reserva no coincide con la tarifa actual?', blocks: [{ p: 'El total se calcula con la tarifa vigente al crear la reserva o al cambiar sus fechas o su habitación. Si después cambia la tarifa del catálogo, el importe registrado no se recalcula.' }] },
      { id: 'pestanas', title: '¿Por qué se cerró mi sesión en otra pestaña?', blocks: [{ p: 'La sesión se comparte entre las pestañas abiertas del sitio en el mismo navegador. Si cierra sesión en una, se cierra en todas. La sesión también vence a la hora.' }] },
      { id: 'cuenta-datos', title: '¿Puedo modificar o eliminar mi cuenta?', blocks: [{ p: 'La plataforma todavía no ofrece esas funciones por cuenta propia. Puede solicitarlo por los datos de contacto publicados en el sitio; la solicitud se atiende manualmente.' }] },
    ],
  },
};
