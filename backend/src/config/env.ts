import "dotenv/config";
import {z} from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(4000),
    
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