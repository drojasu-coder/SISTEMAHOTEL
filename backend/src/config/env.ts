import "dotenv/config";
import {z} from "zod";

const envSchema = z.object({

    EVENT_DEPOSIT_PERCENTAGE: z.coerce
  .number()
  .gt(0, "EVENT_DEPOSIT_PERCENTAGE debe ser mayor que 0")
  .lte(100, "EVENT_DEPOSIT_PERCENTAGE no puede superar 100"),

    PORT: z.coerce.number().int().positive().default(4000),

    TRANSPORT_BLOCK_MINUTES: z.coerce
  .number()
  .int()
  .positive("TRANSPORT_BLOCK_MINUTES debe ser mayor que cero")
  .default(120),

  CART_EXPIRATION_MINUTES: z.coerce
  .number()
  .int()
  .positive(
    "CART_EXPIRATION_MINUTES debe ser mayor que cero"
  )
  .default(15),
    
    JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET debe tener al menos 32 caracteres"),

    JWT_EXPIRES_IN: z.string().default("1h"),
});



const result = envSchema.safeParse(process.env);

if(!result.success){
    console.error("Error en las variables de entorno:");

    console.error(
        result.error.issues.map((issue) =>({
            campo: issue.path.join("."),
            mensaje: issue.message,
        }))
    );

    process.exit(1);
}

export  const env = result.data;