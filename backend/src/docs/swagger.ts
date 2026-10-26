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
    name: "Autenticación",
    description: "Registro, inicio de sesión y verificación de sesión",
  },
  {
    name: "Habitaciones",
    description: "Administración y consulta de disponibilidad de habitaciones",
  },
  {
    name: "Reservas de Habitación",
    description: "Reservas y disponibilidad de habitaciones del hotel",
  },
  {
    name: "Sucursales",
    description: "Administración de sucursales del hotel",
  },
  {
    name: "Parqueos",
    description: "Catálogo y gestión de espacios de parqueo",
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
  {
    name: "Pagos",
    description: "Operaciones de checkout, registro de pagos y recuperación de intentos",
  },
  {
    name: "Carritos",
    description: "Operaciones y ciclo de vida del carrito de compras",
  },
  {
    name: "Ítems de Carrito",
    description: "Gestión de ítems agregados al carrito",
  },
  {
    name: "Multimedia",
    description: "Gestión y entrega de medios y recursos gráficos desde AWS S3",
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
        RegisterRequest: {
          type: "object",
          required: [
            "nombre",
            "email",
            "password",
          ],
          additionalProperties: false,
          properties: {
            nombre: {
              type: "string",
              minLength: 2,
              maxLength: 150,
              example: "Juan Pérez",
            },
            email: {
              type: "string",
              format: "email",
              maxLength: 150,
              example: "juan.perez@ejemplo.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              maxLength: 72,
              example: "Password123!",
            },
            telefono: {
              type: "string",
              nullable: true,
              example: "55551234",
            },
          },
        },

        LoginRequest: {
          type: "object",
          required: [
            "email",
            "password",
          ],
          additionalProperties: false,
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "juan.perez@ejemplo.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 1,
              example: "Password123!",
            },
          },
        },

        AuthUser: {
          type: "object",
          required: ["id", "nombre", "email", "telefono", "rol"],
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            nombre: {
              type: "string",
              example: "Juan Pérez",
            },
            email: {
              type: "string",
              format: "email",
              example: "juan.perez@ejemplo.com",
            },
            telefono: {
              type: "string",
              nullable: true,
              example: "55551234",
            },
            rol: {
              type: "string",
              enum: [
                "admin",
                "recepcionista",
                "gerente_restaurante",
                "gerente_habitaciones",
                "empleado_operativo",
                "cliente",
              ],
              example: "cliente",
            },
          },
        },

        AuthUserWithStatus: {
          type: "object",
          required: ["id", "nombre", "email", "telefono", "rol", "activo"],
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            nombre: {
              type: "string",
              example: "Juan Pérez",
            },
            email: {
              type: "string",
              format: "email",
              example: "juan.perez@ejemplo.com",
            },
            telefono: {
              type: "string",
              nullable: true,
              example: "55551234",
            },
            rol: {
              type: "string",
              enum: [
                "admin",
                "recepcionista",
                "gerente_restaurante",
                "gerente_habitaciones",
                "empleado_operativo",
                "cliente",
              ],
              example: "cliente",
            },
            activo: {
              type: "boolean",
              example: true,
            },
          },
        },

        LoginData: {
          type: "object",
          required: ["accessToken", "usuario"],
          properties: {
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            usuario: {
              $ref: "#/components/schemas/AuthUser",
            },
          },
        },

        LoginResponse: {
          type: "object",
          required: ["success", "statusCode", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Inicio de sesión exitoso",
            },
            data: {
              $ref: "#/components/schemas/LoginData",
            },
          },
        },

        RegisterResponse: {
          type: "object",
          required: ["success", "statusCode", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 201,
            },
            message: {
              type: "string",
              example: "Usuario registrado correctamente",
            },
            data: {
              $ref: "#/components/schemas/AuthUserWithStatus",
            },
          },
        },

        AuthMeResponse: {
          type: "object",
          required: ["success", "statusCode", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Usuario autenticado",
            },
            data: {
              $ref: "#/components/schemas/AuthUserWithStatus",
            },
          },
        },

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
            imagen_key: {
              type: "string",
              nullable: true,
              example: "sedes/2/portada_1729881234_abcdef.webp",
            },
            imagen_url: {
              type: "string",
              nullable: true,
              example: "https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/sedes/2/portada_1729881234_abcdef.webp?...",
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

Carrito: {
  type: "object",
  required: [
    "id",
    "usuario_id",
    "estado",
    "expira_en",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: {
      type: "integer",
      example: 1,
    },
    usuario_id: {
      type: "integer",
      example: 2,
    },
    estado: {
      type: "string",
      enum: [
        "activo",
        "expirado",
        "pagado",
      ],
      example: "activo",
    },
    expira_en: {
      type: "string",
      format: "date-time",
      nullable: true,
      example: "2026-10-15T18:00:00.000Z",
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
  required: [
    "id",
    "carrito_id",
    "tipo_item",
    "referencia_id",
    "descripcion",
    "precio",
    "cantidad",
    "promocion_id",
    "createdAt",
    "updatedAt",
  ],
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
      example: "Evento ejecutivo - 2026-09-30",
    },
    precio: {
      oneOf: [
        {
          type: "string",
          example: "4000.00",
          description: "Precio unitario devuelto como cadena decimal por PostgreSQL",
        },
        {
          type: "number",
          format: "double",
          example: 4000.0,
        },
      ],
      description: "Precio unitario del ítem",
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
  required: [
    "items",
    "total",
  ],
  properties: {
    items: {
      type: "array",
      items: {
        $ref: "#/components/schemas/CarritoItem",
      },
    },
    total: {
      type: "number",
      format: "double",
      example: 4000.0,
      description: "Monto total del carrito calculado por el servidor como número decimal",
    },
  },
},

CarritoResponse: {
  type: "object",
  required: ["success", "statusCode", "message", "data"],
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    statusCode: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Carrito activo obtenido correctamente",
    },
    data: {
      $ref: "#/components/schemas/Carrito",
    },
  },
},

CarritosResponse: {
  type: "object",
  required: ["success", "statusCode", "message", "data"],
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    statusCode: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Carritos obtenidos correctamente",
    },
    data: {
      type: "array",
      items: {
        $ref: "#/components/schemas/Carrito",
      },
    },
  },
},

CarritoItemsResponse: {
  type: "object",
  required: ["success", "statusCode", "message", "data"],
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    statusCode: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Ítems del carrito obtenidos correctamente",
    },
    data: {
      $ref: "#/components/schemas/CarritoItemsData",
    },
  },
},

CarritoItemResponse: {
  type: "object",
  required: ["success", "statusCode", "message", "data"],
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    statusCode: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Ítem del carrito obtenido correctamente",
    },
    data: {
      $ref: "#/components/schemas/CarritoItem",
    },
  },
},

        Sucursal: {
          type: "object",
          required: [
            "id",
            "nombre",
            "activa",
            "createdAt",
            "updatedAt",
          ],
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
              nullable: true,
              example: "Zona 10",
            },
            ciudad: {
              type: "string",
              nullable: true,
              example: "Guatemala",
            },
            telefono: {
              type: "string",
              nullable: true,
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
              minLength: 1,
              maxLength: 150,
              example: "Hotel Central",
            },
            direccion: {
              type: "string",
              maxLength: 255,
              nullable: true,
              example: "Zona 10",
            },
            ciudad: {
              type: "string",
              maxLength: 100,
              nullable: true,
              example: "Guatemala",
            },
            telefono: {
              type: "string",
              maxLength: 20,
              nullable: true,
              example: "22223333",
            },
          },
        },

        UpdateSucursalRequest: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: {
            nombre: {
              type: "string",
              minLength: 1,
              maxLength: 150,
              example: "Hotel Central Renovado",
            },
            direccion: {
              type: "string",
              maxLength: 255,
              nullable: true,
              example: "Zona 10",
            },
            ciudad: {
              type: "string",
              maxLength: 100,
              nullable: true,
              example: "Guatemala",
            },
            telefono: {
              type: "string",
              maxLength: 20,
              nullable: true,
              example: "22224444",
            },
            activa: {
              type: "boolean",
              example: true,
            },
          },
        },

        SucursalResponse: {
          type: "object",
          required: [
            "status",
            "data",
          ],
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            data: {
              $ref: "#/components/schemas/Sucursal",
            },
          },
        },

        SucursalesResponse: {
          type: "object",
          required: [
            "status",
            "data",
          ],
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Sucursal",
              },
            },
          },
        },

        PresignImageRequest: {
          type: "object",
          required: ["contentType"],
          properties: {
            contentType: {
              type: "string",
              enum: ["image/jpeg", "image/png", "image/webp"],
              example: "image/webp",
            },
            fileName: {
              type: "string",
              nullable: true,
              example: "portada.webp",
            },
          },
        },

        PresignImageResponse: {
          type: "object",
          required: ["status", "data"],
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            data: {
              type: "object",
              required: ["uploadUrl", "uploadToken", "tempKey", "expiresInSeconds"],
              properties: {
                uploadUrl: {
                  type: "string",
                  example: "https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/sedes/temp/...",
                },
                uploadToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                tempKey: {
                  type: "string",
                  example: "sedes/temp/2_1_1729881234_abcdef.webp",
                },
                expiresInSeconds: {
                  type: "integer",
                  example: 900,
                },
              },
            },
          },
        },

        ConfirmImageRequest: {
          type: "object",
          required: ["uploadToken", "tempKey"],
          properties: {
            uploadToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            tempKey: {
              type: "string",
              example: "sedes/temp/2_1_1729881234_abcdef.webp",
            },
          },
        },

        Parqueo: {
          type: "object",
          required: [
            "id",
            "sucursal_id",
            "numero",
            "estado",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            sucursal_id: {
              type: "integer",
              example: 1,
            },
            numero: {
              type: "string",
              maxLength: 10,
              example: "A-01",
            },
            estado: {
              type: "string",
              enum: ["disponible", "ocupado", "mantenimiento"],
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
            Sucursal: {
              type: "object",
              nullable: true,
              properties: {
                id: {
                  type: "integer",
                  example: 1,
                },
                nombre: {
                  type: "string",
                  example: "Hotel Central",
                },
              },
            },
          },
        },

        CreateParqueoRequest: {
          type: "object",
          required: [
            "sucursal_id",
            "numero",
          ],
          additionalProperties: false,
          properties: {
            sucursal_id: {
              type: "integer",
              minimum: 1,
              example: 1,
            },
            numero: {
              type: "string",
              minLength: 1,
              maxLength: 10,
              example: "A-01",
            },
            estado: {
              type: "string",
              enum: ["disponible", "ocupado", "mantenimiento"],
              example: "disponible",
            },
          },
        },

        UpdateParqueoRequest: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: {
            sucursal_id: {
              type: "integer",
              minimum: 1,
              example: 1,
            },
            numero: {
              type: "string",
              minLength: 1,
              maxLength: 10,
              example: "A-01",
            },
            estado: {
              type: "string",
              enum: ["disponible", "ocupado", "mantenimiento"],
              example: "disponible",
            },
          },
        },

        ParqueoResponse: {
          type: "object",
          required: [
            "success",
            "statusCode",
            "message",
            "data",
          ],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Parqueo obtenido correctamente",
            },
            data: {
              $ref: "#/components/schemas/Parqueo",
            },
          },
        },

        ParqueosResponse: {
          type: "object",
          required: [
            "success",
            "statusCode",
            "message",
            "data",
          ],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Parqueos obtenidos correctamente",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Parqueo",
              },
            },
          },
        },

        ParqueoDeleteResponse: {
          type: "object",
          required: [
            "success",
            "statusCode",
            "message",
            "data",
          ],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Parqueo eliminado correctamente",
            },
            data: {
              nullable: true,
              example: null,
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

    Sucursal: {
      type: "object",
      nullable: true,
      properties: {
        nombre: {
          type: "string",
          example: "Hotel Central",
        },
      },
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
      maxLength: 30,
      example: "terraza",
    },

    capacidad: {
      type: "integer",
      minimum: 1,
      example: 4,
    },

    estado: {
      type: "string",
      maxLength: 20,
      example: "disponible",
    },
  },
},

UpdateMesaRequest: {
  type: "object",

  minProperties: 1,

  additionalProperties: false,

  properties: {
    zona: {
      type: "string",
      maxLength: 30,
      example: "interior",
    },

    capacidad: {
      type: "integer",
      minimum: 1,
      example: 6,
    },

    estado: {
      type: "string",
      maxLength: 20,
      example: "disponible",
    },
  },
},

MesaResponse: {
  type: "object",
  properties: {
    status: {
      type: "string",
      example: "success",
    },
    data: {
      $ref: "#/components/schemas/Mesa",
    },
  },
},

MesasResponse: {
  type: "object",
  properties: {
    status: {
      type: "string",
      example: "success",
    },
    data: {
      type: "array",
      items: {
        $ref: "#/components/schemas/Mesa",
      },
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
    precio_hora: {
      type: "number",
      minimum: 0,
      example: 50.00,
    },
    precio_equipo: {
      type: "number",
      minimum: 0,
      example: 10.00,
    },
    precio_instructor_hora: {
      type: "number",
      minimum: 0,
      example: 25.00,
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
    precio_hora: {
      type: "number",
      minimum: 0,
      example: 50.00,
    },
    precio_equipo: {
      type: "number",
      minimum: 0,
      example: 10.00,
    },
    precio_instructor_hora: {
      type: "number",
      minimum: 0,
      example: 25.00,
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
    precio_hora: {
      type: "number",
      minimum: 0,
      example: 50.00,
    },
    precio_equipo: {
      type: "number",
      minimum: 0,
      example: 10.00,
    },
    precio_instructor_hora: {
      type: "number",
      minimum: 0,
      example: 25.00,
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
    total: {
      type: "string",
      example: "75.00",
    },
    RecursoActividad: {
      $ref: "#/components/schemas/RecursoActividad",
    },
    Instructor: {
      $ref: "#/components/schemas/Instructor",
      nullable: true,
    },
    Usuario: {
      $ref: "#/components/schemas/Usuario",
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
  required: [
    "id",
    "sucursal_id",
    "nombre",
    "aforo_maximo",
    "createdAt",
    "updatedAt",
  ],
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
    Sucursal: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "integer", example: 1 },
        nombre: { type: "string", example: "Hotel Hunapú Central" },
      },
    },
  },
},

AmenidadResponse: {
  type: "object",
  required: ["status", "data"],
  properties: {
    status: {
      type: "string",
      example: "success",
    },
    data: {
      $ref: "#/components/schemas/Amenidad",
    },
  },
},

AmenidadesResponse: {
  type: "object",
  required: ["status", "data"],
  properties: {
    status: {
      type: "string",
      example: "success",
    },
    data: {
      type: "array",
      items: {
        $ref: "#/components/schemas/Amenidad",
      },
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
  required: [
    "id",
    "usuario_id",
    "amenidad_id",
    "fecha",
    "franja_horaria",
    "estado",
    "createdAt",
    "updatedAt",
  ],
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
    Amenidad: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "integer", example: 1 },
        nombre: { type: "string", example: "Piscina" },
        aforo_maximo: { type: "integer", example: 20 },
        sucursal_id: { type: "integer", example: 1 },
        Sucursal: {
          type: "object",
          nullable: true,
          properties: {
            id: { type: "integer", example: 1 },
            nombre: { type: "string", example: "Hotel Hunapú Central" },
          },
        },
      },
    },
    Usuario: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "integer", example: 3 },
        nombre: { type: "string", example: "Juan Pérez" },
        email: { type: "string", example: "juan@example.com" },
        telefono: { type: "string", nullable: true, example: "55551234" },
      },
    },
  },
},

ReservaAmenidadResponse: {
  type: "object",
  required: ["success", "statusCode", "message", "data"],
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    statusCode: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Reserva de amenidad obtenida correctamente",
    },
    data: {
      $ref: "#/components/schemas/ReservaAmenidad",
    },
  },
},

ReservasAmenidadResponse: {
  type: "object",
  required: ["success", "statusCode", "message", "data"],
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    statusCode: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Reservas de amenidad obtenidas correctamente",
    },
    data: {
      type: "array",
      items: {
        $ref: "#/components/schemas/ReservaAmenidad",
      },
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

        ReservaHabitacionUsuario: {
          type: "object",
          required: ["id", "nombre", "email", "rol"],
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            nombre: {
              type: "string",
              example: "Juan Pérez",
            },
            email: {
              type: "string",
              format: "email",
              example: "juan.perez@ejemplo.com",
            },
            rol: {
              type: "string",
              example: "cliente",
            },
            telefono: {
              type: "string",
              nullable: true,
              example: "55551234",
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

        ReservaHabitacionTipo: {
          type: "object",
          required: ["id", "nombre", "capacidad_maxima", "tarifa_noche"],
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            nombre: {
              type: "string",
              example: "Suite Presidencial",
            },
            capacidad_maxima: {
              type: "integer",
              example: 4,
            },
            tarifa_noche: {
              type: "string",
              example: "450.00",
              description: "Tarifa por noche en formato decimal con dos dígitos",
            },
            descripcion: {
              type: "string",
              nullable: true,
              example: "Habitación espaciosa con vista panorámica",
            },
          },
        },

        ReservaHabitacionSucursal: {
          type: "object",
          required: ["id", "nombre"],
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            nombre: {
              type: "string",
              example: "Hotel Central Guatemala",
            },
            activa: {
              type: "boolean",
              example: true,
            },
          },
        },

        ReservaHabitacionHabitacion: {
          type: "object",
          required: [
            "id",
            "sucursal_id",
            "tipo_habitacion_id",
            "numero",
            "estado",
          ],
          properties: {
            id: {
              type: "integer",
              example: 10,
            },
            sucursal_id: {
              type: "integer",
              example: 1,
            },
            tipo_habitacion_id: {
              type: "integer",
              example: 1,
            },
            numero: {
              type: "string",
              example: "101",
            },
            estado: {
              type: "string",
              enum: ["disponible", "ocupada", "mantenimiento", "limpieza"],
              example: "disponible",
            },
            TipoHabitacion: {
              $ref: "#/components/schemas/ReservaHabitacionTipo",
            },
            Sucursal: {
              $ref: "#/components/schemas/ReservaHabitacionSucursal",
            },
          },
        },

        ReservaHabitacion: {
          type: "object",
          required: [
            "id",
            "usuario_id",
            "habitacion_id",
            "fecha_entrada",
            "fecha_salida",
            "numero_huespedes",
            "estado",
            "total",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            usuario_id: {
              type: "integer",
              example: 3,
            },
            habitacion_id: {
              type: "integer",
              example: 10,
            },
            fecha_entrada: {
              type: "string",
              format: "date",
              example: "2026-12-01",
            },
            fecha_salida: {
              type: "string",
              format: "date",
              example: "2026-12-05",
            },
            numero_huespedes: {
              type: "integer",
              minimum: 1,
              example: 2,
            },
            estado: {
              type: "string",
              enum: [
                "pendiente",
                "confirmada",
                "cancelada",
                "finalizada",
                "expirada",
              ],
              example: "pendiente",
            },
            total: {
              type: "string",
              example: "1800.00",
              description: "Monto total calculado por el servidor con formato decimal",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
            Usuario: {
              $ref: "#/components/schemas/ReservaHabitacionUsuario",
            },
            Habitacion: {
              $ref: "#/components/schemas/ReservaHabitacionHabitacion",
            },
          },
        },

        CreateReservaHabitacionRequest: {
          type: "object",
          required: [
            "habitacion_id",
            "fecha_entrada",
            "fecha_salida",
            "numero_huespedes",
          ],
          additionalProperties: false,
          properties: {
            usuario_id: {
              type: "integer",
              minimum: 1,
              example: 1,
              description: "Opcional para clientes (asignado desde JWT); obligatorio para roles administrativos",
            },
            habitacion_id: {
              type: "integer",
              minimum: 1,
              example: 10,
            },
            fecha_entrada: {
              type: "string",
              format: "date",
              example: "2026-12-01",
            },
            fecha_salida: {
              type: "string",
              format: "date",
              example: "2026-12-05",
            },
            numero_huespedes: {
              type: "integer",
              minimum: 1,
              example: 2,
            },
          },
        },

        HabitacionDisponible: {
          type: "object",
          required: [
            "id",
            "numero",
            "estado",
            "sucursal_id",
            "tipo_habitacion_id",
            "noches",
            "tarifa_noche",
            "total_estimado",
          ],
          properties: {
            id: {
              type: "integer",
              example: 10,
            },
            numero: {
              type: "string",
              example: "101",
            },
            estado: {
              type: "string",
              example: "disponible",
            },
            sucursal_id: {
              type: "integer",
              example: 1,
            },
            tipo_habitacion_id: {
              type: "integer",
              example: 1,
            },
            noches: {
              type: "integer",
              example: 4,
            },
            tarifa_noche: {
              type: "string",
              example: "450.00",
              description: "Tarifa por noche en formato decimal con dos dígitos",
            },
            total_estimado: {
              type: "string",
              example: "1800.00",
              description: "Monto total estimado para la estancia con dos decimales",
            },
            Sucursal: {
              $ref: "#/components/schemas/ReservaHabitacionSucursal",
            },
            TipoHabitacion: {
              $ref: "#/components/schemas/ReservaHabitacionTipo",
            },
          },
        },

        ReservaHabitacionResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Reserva de habitación obtenida correctamente",
            },
            data: {
              $ref: "#/components/schemas/ReservaHabitacion",
            },
          },
        },

        ReservaHabitacionCreatedResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 201,
            },
            message: {
              type: "string",
              example: "Reserva de habitación creada correctamente",
            },
            data: {
              $ref: "#/components/schemas/ReservaHabitacion",
            },
          },
        },

        ReservasHabitacionResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Reservas de habitación obtenidas correctamente",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ReservaHabitacion",
              },
            },
          },
        },

        DisponibilidadHabitacionesResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            message: {
              type: "string",
              example: "Habitaciones disponibles obtenidas correctamente",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/HabitacionDisponible",
              },
            },
          },
        },

        Pago: {
          type: "object",
          required: [
            "id",
            "monto",
            "metodo",
            "estado",
            "moneda",
            "tipo_pago",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { type: "integer", example: 42 },
            reserva_habitacion_id: { type: "integer", nullable: true, example: null },
            carrito_id: { type: "integer", nullable: true, example: 15 },
            monto: {
              oneOf: [
                { type: "string", example: "1800.00" },
                { type: "number", example: 1800 },
              ],
            },
            metodo: {
              type: "string",
              enum: ["tarjeta", "efectivo", "transferencia"],
              example: "tarjeta",
            },
            estado: {
              type: "string",
              enum: [
                "pendiente",
                "procesando",
                "aprobado",
                "rechazado",
                "cancelado",
                "reembolsado",
                "reembolsado_parcial",
              ],
              example: "procesando",
            },
            id_transaccion_externo: { type: "string", nullable: true, example: "pi_123456789" },
            moneda: { type: "string", example: "GTQ" },
            tipo_pago: {
              type: "string",
              enum: ["total", "anticipo", "saldo"],
              example: "total",
            },
            pasarela: { type: "string", nullable: true, example: "stripe" },
            idempotency_key: { type: "string", nullable: true, example: "chk-u1-c15-xyz" },
            fecha_pago: { type: "string", format: "date-time", nullable: true, example: "2026-10-22T14:30:00.000Z" },
            codigo_error_externo: { type: "string", nullable: true, example: null },
            mensaje_error: { type: "string", nullable: true, example: null },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        CreatePagoRequest: {
          type: "object",
          required: ["monto", "metodo", "moneda"],
          additionalProperties: false,
          properties: {
            carrito_id: { type: "integer", minimum: 1, nullable: true },
            reserva_habitacion_id: { type: "integer", minimum: 1, nullable: true },
            monto: {
              oneOf: [
                { type: "number", minimum: 0.01 },
                { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
              ],
              example: 1800,
            },
            metodo: {
              type: "string",
              enum: ["tarjeta", "efectivo", "transferencia"],
              example: "tarjeta",
            },
            tipo_pago: {
              type: "string",
              enum: ["total", "anticipo", "saldo"],
              example: "total",
            },
            moneda: { type: "string", enum: ["GTQ"], example: "GTQ" },
            idempotency_key: { type: "string", maxLength: 150, nullable: true, example: "chk-u1-c15-xyz" },
          },
        },

        CreatePagoResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 201 },
            message: { type: "string", example: "Pago creado correctamente" },
            data: {
              oneOf: [
                {
                  type: "object",
                  required: ["pago_id", "estado", "monto", "moneda"],
                  properties: {
                    pago_id: { type: "integer", example: 42 },
                    payment_intent_id: { type: "string", example: "pi_123456789" },
                    client_secret: { type: "string", example: "pi_123_secret_abc" },
                    estado: { type: "string", example: "procesando" },
                    monto: {
                      oneOf: [{ type: "number" }, { type: "string" }],
                      example: 1800,
                    },
                    moneda: { type: "string", example: "GTQ" },
                  },
                },
                { $ref: "#/components/schemas/Pago" },
              ],
            },
          },
        },

        ResumenPagoData: {
          type: "object",
          required: ["total", "anticipo_requerido", "aprobado", "saldo"],
          properties: {
            total: { type: "number", example: 1800 },
            anticipo_requerido: { type: "number", example: 1800 },
            aprobado: { type: "number", example: 0 },
            saldo: { type: "number", example: 1800 },
          },
        },

        ResumenPagoResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Resumen de pago obtenido correctamente" },
            data: { $ref: "#/components/schemas/ResumenPagoData" },
          },
        },

        IntentoActivoData: {
          type: "object",
          required: [
            "pago_id",
            "payment_intent_id",
            "client_secret",
            "estado_local",
            "estado_pasarela",
            "estado_intento",
            "monto",
            "moneda",
            "puede_confirmar",
          ],
          properties: {
            pago_id: { type: "integer", example: 42 },
            payment_intent_id: { type: "string", nullable: true, example: "pi_123456789" },
            client_secret: { type: "string", nullable: true, example: "pi_123_secret_abc" },
            estado_local: {
              type: "string",
              enum: [
                "pendiente",
                "procesando",
                "aprobado",
                "rechazado",
                "cancelado",
                "reembolsado",
                "reembolsado_parcial",
              ],
              example: "procesando",
            },
            estado_pasarela: { type: "string", example: "requires_payment_method" },
            estado_intento: {
              type: "string",
              enum: [
                "requiere_confirmacion",
                "procesando",
                "completado_en_pasarela",
                "cancelado",
              ],
              example: "requiere_confirmacion",
            },
            monto: { type: "number", example: 1800 },
            moneda: { type: "string", example: "GTQ" },
            puede_confirmar: { type: "boolean", example: true },
          },
        },

        IntentoActivoPagoResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Intento de pago activo obtenido correctamente" },
            data: {
              oneOf: [
                { $ref: "#/components/schemas/IntentoActivoData" },
                { type: "null" },
              ],
            },
          },
        },

        PagoResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Pago obtenido correctamente" },
            data: { $ref: "#/components/schemas/Pago" },
          },
        },

        PagosResponse: {
          type: "object",
          required: ["success", "statusCode", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Pagos obtenidos correctamente" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Pago" },
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

        BrandingMedia: {
          type: "object",
          required: [
            "logoHorizontalColor",
            "logoHorizontalBlanco",
            "isotipoColor",
            "expiresAt",
          ],
          properties: {
            logoHorizontalColor: {
              type: "string",
              format: "uri",
              example:
                "https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-color.svg",
            },
            logoHorizontalBlanco: {
              type: "string",
              format: "uri",
              example:
                "https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg",
            },
            isotipoColor: {
              type: "string",
              format: "uri",
              example:
                "https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-isotipo-color.svg",
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              example: "2026-10-25T12:00:00.000Z",
            },
          },
        },

        BrandingResponse: {
          type: "object",
          required: ["status", "data"],
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            data: {
              $ref: "#/components/schemas/BrandingMedia",
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