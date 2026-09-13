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
              example: "EVENT_SERVICE_NOT_FOUND",
            },
            message: {
              type: "string",
              example:
                "El servicio de evento solicitado no existe",
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
                    example: "precio",
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