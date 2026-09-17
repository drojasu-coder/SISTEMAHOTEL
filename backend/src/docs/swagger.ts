import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

const routesPath = path
  .resolve(process.cwd(), "src", "routes", "**", "*.ts")
  .replace(/\\/g, "/");

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "SISTEMAHOTEL API",
      version: "1.0.0",
      description:
        "API REST para la administración del sistema hotelero: usuarios, habitaciones, reservas, eventos, servicios, pagos, personal y demás módulos.",
    },

    servers: [
      {
        url: "http://localhost:4000",
        description: "Servidor local de desarrollo",
      },
    ],

    tags: [
  {
    name: "Sucursales",
    description: "Administración de sucursales del hotel",
  },
  {
    name: "Mesas",
    description: "Administración de mesas del restaurante",
  },
  {
    name: "Reservas de Mesa",
    description: "Reservas de mesas del restaurante",
  },
  {
    name: "Recursos de Actividad",
    description: "Recursos disponibles para actividades",
  },
  {
    name: "Instructores",
    description: "Administración de instructores",
  },
  {
    name: "Reservas de Actividad",
    description: "Reservas de actividades del hotel",
  },
  {
    name: "Amenidades",
    description: "Administración de amenidades",
  },
  {
    name: "Reservas de Amenidad",
    description: "Reservas y control de aforo de amenidades",
  },
  {
    name: "Terapeutas",
    description: "Administración de terapeutas",
  },
  {
    name: "Servicios de Bienestar",
    description: "Servicios de bienestar y spa",
  },
  {
    name: "Citas de Bienestar",
    description: "Reservas de citas de bienestar",
  },
  {
    name: "Boletos de Parque",
    description: "Venta y administración de boletos del parque",
  },
],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        ServicioEvento: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            nombre: {
              type: "string",
              example: "Catering premium",
            },
            precio: {
              type: "number",
              example: 750.0,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        Salon: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            sucursal_id: {
              type: "integer",
              example: 1,
            },
            nombre: {
              type: "string",
              example: "Salón Imperial",
            },
            capacidad_maxima: {
              type: "integer",
              example: 250,
            },
            tarifa_base: {
              type: "number",
              example: 3500.0,
            },
            descripcion: {
              type: "string",
              nullable: true,
              example:
                "Salón principal para bodas y eventos ejecutivos",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        Usuario: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 2,
    },
    nombre: {
      type: "string",
      example: "Ana López",
    },
    email: {
      type: "string",
      format: "email",
      example: "ana@hotel.com",
    },
    rol: {
      type: "string",
      example: "recepcionista",
    },
    telefono: {
      type: "string",
      nullable: true,
      example: "55554444",
    },
    activo: {
      type: "boolean",
      example: true,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

ReservaEvento: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 2,
    },
    salon_id: {
      type: "integer",
      example: 1,
    },
    tipo_evento: {
      type: "string",
      enum: [
        "boda",
        "cumpleanos",
        "ejecutivo",
        "convivio",
      ],
      example: "boda",
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-20",
    },
    hora_inicio: {
      type: "string",
      example: "10:00:00",
    },
    hora_fin: {
      type: "string",
      example: "14:00:00",
    },
    numero_invitados: {
      type: "integer",
      example: 150,
    },
    estado: {
      type: "string",
      enum: [
        "cotizacion",
        "confirmada",
        "expirada",
        "cancelada",
      ],
      example: "cotizacion",
    },
    anticipo: {
      type: "number",
      format: "decimal",
      example: 1050.0,
    },
    total: {
      type: "number",
      format: "decimal",
      example: 3500.0,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

ReservaEventoServicio: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    reserva_evento_id: {
      type: "integer",
      example: 5,
    },
    servicio_evento_id: {
      type: "integer",
      example: 1,
    },
    cantidad: {
      type: "integer",
      minimum: 1,
      example: 2,
    },
    subtotal: {
      type: "number",
      format: "decimal",
      example: 1500.0,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

ReservaEventoMontos: {
  type: "object",
  properties: {
    total: {
      type: "number",
      format: "decimal",
      example: 5000.0,
    },
    anticipo: {
      type: "number",
      format: "decimal",
      example: 1500.0,
    },
  },
},

Empleado: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 3,
    },
    sucursal_id: {
      type: "integer",
      example: 1,
    },
    area: {
      type: "string",
      example: "Mantenimiento",
    },
    fecha_contratacion: {
      type: "string",
      format: "date",
      nullable: true,
      example: "2026-09-01",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

Turno: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    empleado_id: {
      type: "integer",
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-10",
    },
    hora_inicio: {
      type: "string",
      example: "08:00:00",
    },
    hora_fin: {
      type: "string",
      example: "16:00:00",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

Chofer: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    nombre: {
      type: "string",
      example: "Luis Pérez",
    },
    licencia: {
      type: "string",
      nullable: true,
      example: "A-123456",
    },
    activo: {
      type: "boolean",
      example: true,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

Vehiculo: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    tipo: {
      type: "string",
      enum: [
        "shuttle",
        "van",
        "sedan",
      ],
      example: "van",
    },
    capacidad: {
      type: "integer",
      minimum: 1,
      example: 12,
    },
    placa: {
      type: "string",
      nullable: true,
      example: "P-123ABC",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

ReservaTransporte: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 2,
    },
    chofer_id: {
      type: "integer",
      nullable: true,
      example: 1,
    },
    vehiculo_id: {
      type: "integer",
      nullable: true,
      example: 2,
    },
    origen: {
      type: "string",
      example: "Aeropuerto La Aurora",
    },
    destino: {
      type: "string",
      example: "Hotel Central",
    },
    fecha_hora: {
      type: "string",
      format: "date-time",
      example: "2026-10-20T08:00:00-06:00",
    },
    numero_pasajeros: {
      type: "integer",
      minimum: 1,
      example: 3,
    },
    estado: {
      type: "string",
      enum: [
        "pendiente",
        "confirmada",
        "cancelada",
      ],
      example: "confirmada",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CarritoItem: {
  type: "object",

  properties: {
    id: {
      type: "integer",
      example: 1,
    },

    carrito_id: {
      type: "integer",
      example: 5,
    },

    tipo_item: {
      type: "string",

      enum: [
        "habitacion",
        "evento",
        "mesa",
        "actividad",
        "amenidad",
        "bienestar",
        "boleto_parque",
        "transporte",
      ],

      example: "evento",
    },

    referencia_id: {
      type: "integer",
      example: 6,
    },

    descripcion: {
      type: "string",
      nullable: true,
      example:
        "Evento ejecutivo - 2026-09-30",
    },

    precio: {
      type: "number",
      format: "double",
      example: 4000.0,
    },

    cantidad: {
      type: "integer",
      minimum: 1,
      example: 1,
    },

    promocion_id: {
      type: "integer",
      nullable: true,
      example: null,
    },

    createdAt: {
      type: "string",
      format: "date-time",
    },

    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateCarritoItemRequest: {
  type: "object",

  required: [
    "tipo_item",
    "referencia_id",
  ],

  additionalProperties: false,

  properties: {
    tipo_item: {
      type: "string",

      enum: [
        "habitacion",
        "evento",
        "mesa",
        "actividad",
        "amenidad",
        "bienestar",
        "boleto_parque",
        "transporte",
      ],

      example: "evento",
    },

    referencia_id: {
      type: "integer",
      minimum: 1,
      example: 6,
    },
  },
},

CarritoItemsData: {
  type: "object",

  properties: {
    items: {
      type: "array",

      items: {
        $ref:
          "#/components/schemas/CarritoItem",
      },
    },

    total: {
      type: "number",
      format: "double",
      example: 4000.0,
    },
  },
},

Sucursal: {
  type: "object",

  properties: {
    id: {
      type: "integer",
      example: 1,
    },

    nombre: {
      type: "string",
      example: "Hotel Central",
    },

    direccion: {
      type: "string",
      example: "Zona 10",
    },

    ciudad: {
      type: "string",
      example: "Guatemala",
    },

    telefono: {
      type: "string",
      example: "22223333",
    },

    activa: {
      type: "boolean",
      example: true,
    },

    createdAt: {
      type: "string",
      format: "date-time",
    },

    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateSucursalRequest: {
  type: "object",

  required: [
    "nombre",
  ],

  additionalProperties: false,

  properties: {
    nombre: {
      type: "string",
      example: "Hotel Central",
    },

    direccion: {
      type: "string",
      example: "Zona 10",
    },

    ciudad: {
      type: "string",
      example: "Guatemala",
    },

    telefono: {
      type: "string",
      example: "22223333",
    },
  },
},

UpdateSucursalRequest: {
  type: "object",

  additionalProperties: false,

  properties: {
    nombre: {
      type: "string",
      example: "Hotel Central Renovado",
    },

    direccion: {
      type: "string",
      example: "Zona 10",
    },

    ciudad: {
      type: "string",
      example: "Guatemala",
    },

    telefono: {
      type: "string",
      example: "22224444",
    },

    activa: {
      type: "boolean",
      example: true,
    },
  },
},

Mesa: {
  type: "object",

  properties: {
    id: {
      type: "integer",
      example: 1,
    },

    sucursal_id: {
      type: "integer",
      example: 1,
    },

    zona: {
      type: "string",
      example: "terraza",
    },

    capacidad: {
      type: "integer",
      example: 4,
    },

    estado: {
      type: "string",
      example: "disponible",
    },

    createdAt: {
      type: "string",
      format: "date-time",
    },

    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateMesaRequest: {
  type: "object",

  required: [
    "sucursal_id",
    "zona",
    "capacidad",
  ],

  additionalProperties: false,

  properties: {
    sucursal_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },

    zona: {
      type: "string",
      example: "terraza",
    },

    capacidad: {
      type: "integer",
      minimum: 1,
      example: 4,
    },
  },
},

UpdateMesaRequest: {
  type: "object",

  additionalProperties: false,

  properties: {
    zona: {
      type: "string",
      example: "interior",
    },

    capacidad: {
      type: "integer",
      minimum: 1,
      example: 6,
    },

    estado: {
      type: "string",
      example: "disponible",
    },
  },
},

ReservaMesa: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 3,
    },
    mesa_id: {
      type: "integer",
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-10",
    },
    hora: {
      type: "string",
      example: "19:00:00",
    },
    numero_comensales: {
      type: "integer",
      example: 4,
    },
    estado: {
      type: "string",
      enum: [
        "confirmada",
        "cancelada",
      ],
      example: "confirmada",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateReservaMesaRequest: {
  type: "object",
  required: [
    "mesa_id",
    "fecha",
    "hora",
    "numero_comensales",
  ],
  additionalProperties: false,
  properties: {
    mesa_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-10",
    },
    hora: {
      type: "string",
      example: "19:00",
    },
    numero_comensales: {
      type: "integer",
      minimum: 1,
      example: 4,
    },
  },
},

UpdateReservaMesaEstadoRequest: {
  type: "object",
  required: [
    "estado",
  ],
  additionalProperties: false,
  properties: {
    estado: {
      type: "string",
      enum: [
        "confirmada",
        "cancelada",
      ],
      example: "cancelada",
    },
  },
},

RecursoActividad: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    sucursal_id: {
      type: "integer",
      example: 1,
    },
    tipo: {
      type: "string",
      example: "tenis",
    },
    nombre: {
      type: "string",
      example: "Cancha de tenis 1",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateRecursoActividadRequest: {
  type: "object",
  required: [
    "sucursal_id",
    "tipo",
    "nombre",
  ],
  additionalProperties: false,
  properties: {
    sucursal_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },
    tipo: {
      type: "string",
      example: "tenis",
    },
    nombre: {
      type: "string",
      example: "Cancha de tenis 1",
    },
  },
},

UpdateRecursoActividadRequest: {
  type: "object",
  additionalProperties: false,
  properties: {
    tipo: {
      type: "string",
      example: "pádel",
    },
    nombre: {
      type: "string",
      example: "Cancha de pádel 1",
    },
  },
},

Instructor: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    nombre: {
      type: "string",
      example: "Carlos Méndez",
    },
    especialidad: {
      type: "string",
      nullable: true,
      example: "Tenis",
    },
    activo: {
      type: "boolean",
      example: true,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateInstructorRequest: {
  type: "object",
  required: [
    "nombre",
  ],
  additionalProperties: false,
  properties: {
    nombre: {
      type: "string",
      example: "Carlos Méndez",
    },
    especialidad: {
      type: "string",
      nullable: true,
      example: "Tenis",
    },
    activo: {
      type: "boolean",
      example: true,
    },
  },
},

UpdateInstructorRequest: {
  type: "object",
  additionalProperties: false,
  properties: {
    nombre: {
      type: "string",
      example: "Carlos Méndez",
    },
    especialidad: {
      type: "string",
      nullable: true,
      example: "Tenis y pádel",
    },
    activo: {
      type: "boolean",
      example: false,
    },
  },
},

ReservaActividad: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 3,
    },
    recurso_id: {
      type: "integer",
      example: 1,
    },
    instructor_id: {
      type: "integer",
      nullable: true,
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-20",
    },
    hora_inicio: {
      type: "string",
      example: "10:00:00",
    },
    hora_fin: {
      type: "string",
      example: "11:00:00",
    },
    con_equipo: {
      type: "boolean",
      example: true,
    },
    estado: {
      type: "string",
      enum: [
        "confirmada",
        "cancelada",
        "completada",
      ],
      example: "confirmada",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateReservaActividadRequest: {
  type: "object",
  required: [
    "recurso_id",
    "fecha",
    "hora_inicio",
    "hora_fin",
  ],
  additionalProperties: false,
  properties: {
    recurso_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },
    instructor_id: {
      type: "integer",
      minimum: 1,
      nullable: true,
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-20",
    },
    hora_inicio: {
      type: "string",
      example: "10:00",
    },
    hora_fin: {
      type: "string",
      example: "11:00",
    },
    con_equipo: {
      type: "boolean",
      example: true,
    },
  },
},

UpdateReservaActividadRequest: {
  type: "object",
  additionalProperties: false,
  properties: {
    estado: {
      type: "string",
      enum: [
        "confirmada",
        "cancelada",
        "completada",
      ],
      example: "cancelada",
    },
    con_equipo: {
      type: "boolean",
      example: false,
    },
  },
},

Amenidad: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    sucursal_id: {
      type: "integer",
      example: 1,
    },
    nombre: {
      type: "string",
      example: "Piscina",
    },
    aforo_maximo: {
      type: "integer",
      example: 20,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateAmenidadRequest: {
  type: "object",
  required: [
    "sucursal_id",
    "nombre",
    "aforo_maximo",
  ],
  additionalProperties: false,
  properties: {
    sucursal_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },
    nombre: {
      type: "string",
      example: "Piscina",
    },
    aforo_maximo: {
      type: "integer",
      minimum: 1,
      example: 20,
    },
  },
},

UpdateAmenidadRequest: {
  type: "object",
  additionalProperties: false,
  properties: {
    nombre: {
      type: "string",
      example: "Piscina principal",
    },
    aforo_maximo: {
      type: "integer",
      minimum: 1,
      example: 30,
    },
  },
},

ReservaAmenidad: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 3,
    },
    amenidad_id: {
      type: "integer",
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-20",
    },
    franja_horaria: {
      type: "string",
      example: "10:00-12:00",
    },
    mobiliario: {
      type: "string",
      nullable: true,
      example: "camastro",
    },
    codigo_qr: {
      type: "string",
      nullable: true,
      example: "AMENITY-550e8400-e29b-41d4-a716-446655440000",
    },
    estado: {
      type: "string",
      enum: [
        "confirmada",
        "cancelada",
        "usada",
      ],
      example: "confirmada",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateReservaAmenidadRequest: {
  type: "object",
  required: [
    "amenidad_id",
    "fecha",
    "franja_horaria",
  ],
  additionalProperties: false,
  properties: {
    amenidad_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-20",
    },
    franja_horaria: {
      type: "string",
      example: "10:00-12:00",
    },
    mobiliario: {
      type: "string",
      nullable: true,
      example: "camastro",
    },
  },
},

UpdateReservaAmenidadEstadoRequest: {
  type: "object",
  required: [
    "estado",
  ],
  additionalProperties: false,
  properties: {
    estado: {
      type: "string",
      enum: [
        "cancelada",
        "usada",
      ],
      example: "cancelada",
    },
  },
},

Terapeuta: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    nombre: {
      type: "string",
      example: "Ana López",
    },
    activo: {
      type: "boolean",
      example: true,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateTerapeutaRequest: {
  type: "object",
  required: [
    "nombre",
  ],
  additionalProperties: false,
  properties: {
    nombre: {
      type: "string",
      example: "Ana López",
    },
    activo: {
      type: "boolean",
      example: true,
    },
  },
},

UpdateTerapeutaRequest: {
  type: "object",
  additionalProperties: false,
  properties: {
    nombre: {
      type: "string",
      example: "Ana López",
    },
    activo: {
      type: "boolean",
      example: false,
    },
  },
},

ServicioBienestar: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    nombre: {
      type: "string",
      example: "Masaje relajante",
    },
    duracion_minutos: {
      type: "integer",
      minimum: 1,
      example: 60,
    },
    precio: {
      type: "number",
      format: "double",
      example: 350.00,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateServicioBienestarRequest: {
  type: "object",
  required: [
    "nombre",
    "duracion_minutos",
    "precio",
  ],
  additionalProperties: false,
  properties: {
    nombre: {
      type: "string",
      example: "Masaje relajante",
    },
    duracion_minutos: {
      type: "integer",
      minimum: 1,
      example: 60,
    },
    precio: {
      type: "number",
      minimum: 0.01,
      example: 350.00,
    },
  },
},

UpdateServicioBienestarRequest: {
  type: "object",
  additionalProperties: false,
  properties: {
    nombre: {
      type: "string",
      example: "Masaje terapéutico",
    },
    duracion_minutos: {
      type: "integer",
      minimum: 1,
      example: 90,
    },
    precio: {
      type: "number",
      minimum: 0.01,
      example: 450.00,
    },
  },
},

CitaBienestar: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 3,
    },
    servicio_bienestar_id: {
      type: "integer",
      example: 1,
    },
    terapeuta_id: {
      type: "integer",
      nullable: true,
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-20",
    },
    hora_inicio: {
      type: "string",
      example: "10:00:00",
    },
    hora_fin: {
      type: "string",
      example: "11:00:00",
    },
    estado: {
      type: "string",
      enum: [
        "confirmada",
        "cancelada",
        "completada",
      ],
      example: "confirmada",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateCitaBienestarRequest: {
  type: "object",
  required: [
    "terapeuta_id",
    "servicio_bienestar_id",
    "fecha",
    "hora_inicio",
  ],
  additionalProperties: false,
  properties: {
    terapeuta_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },
    servicio_bienestar_id: {
      type: "integer",
      minimum: 1,
      example: 1,
    },
    fecha: {
      type: "string",
      format: "date",
      example: "2026-10-20",
    },
    hora_inicio: {
      type: "string",
      example: "10:00",
    },
  },
},

UpdateCitaBienestarEstadoRequest: {
  type: "object",
  required: [
    "estado",
  ],
  additionalProperties: false,
  properties: {
    estado: {
      type: "string",
      enum: [
        "confirmada",
        "cancelada",
        "completada",
      ],
      example: "cancelada",
    },
  },
},

BoletoParque: {
  type: "object",
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 3,
    },
    fecha_visita: {
      type: "string",
      format: "date",
      example: "2026-10-25",
    },
    tipo_boleto: {
      type: "string",
      enum: [
        "adulto",
        "nino",
        "familiar",
      ],
      example: "adulto",
    },
    precio: {
      type: "number",
      format: "double",
      example: 150.0,
      description:
        "Precio determinado automáticamente por el backend según el tipo de boleto.",
    },
    codigo_qr: {
      type: "string",
      nullable: true,
      example:
        "PARK-550e8400-e29b-41d4-a716-446655440000",
    },
    estado: {
      type: "string",
      enum: [
        "valido",
        "usado",
        "cancelado",
      ],
      example: "valido",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},

CreateBoletoParqueRequest: {
  type: "object",

  required: [
    "tipo_boleto",
    "fecha_visita",
  ],

  additionalProperties: false,

  properties: {
    tipo_boleto: {
      type: "string",
      enum: [
        "adulto",
        "nino",
        "familiar",
      ],
      example: "adulto",
    },

    fecha_visita: {
      type: "string",
      format: "date",
      example: "2026-10-25",
    },
  },
},

UpdateBoletoParqueEstadoRequest: {
  type: "object",

  required: [
    "estado",
  ],

  additionalProperties: false,

  properties: {
    estado: {
      type: "string",
      enum: [
        "valido",
        "usado",
        "cancelado",
      ],
      example: "usado",
    },
  },
},

        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            statusCode: {
              type: "integer",
              example: 404,
            },
            code: {
              type: "string",
              example: "RESOURCE_NOT_FOUND",
            },
            message: {
              type: "string",
              example:
                "El recurso solicitado no existe",
            },
          },
        },

        ValidationErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            statusCode: {
              type: "integer",
              example: 400,
            },
            code: {
              type: "string",
              example: "VALIDATION_ERROR",
            },
            message: {
              type: "string",
              example:
                "Los datos enviados no tienen el formato esperado",
            },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "tarifa_base",
                  },
                  message: {
                    type: "string",
                    example:
                      "Debe ser un número válido",
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  apis: [routesPath, path.resolve(process.cwd(), "src", "app.ts")],
};

export const swaggerSpec =
  swaggerJsdoc(options);