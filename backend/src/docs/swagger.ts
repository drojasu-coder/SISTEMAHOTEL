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

  apis: [routesPath],
};

export const swaggerSpec =
  swaggerJsdoc(options);