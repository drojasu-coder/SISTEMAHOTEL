import { z } from "zod";

// Esquema para la creación (POST)
export const createSucursalSchema = z.object({
  nombre: z
    .string({
      message: "El nombre de la sucursal es obligatorio y debe ser texto",
    })
    .min(1, "El nombre no puede estar vacío")
    .max(150, "El nombre no puede exceder los 150 caracteres"),
    
  direccion: z
    .string({ message: "La dirección debe ser texto" })
    .max(255, "La dirección no puede exceder los 255 caracteres")
    .optional()
    .nullable(),
    
  ciudad: z
    .string({ message: "La ciudad debe ser texto" })
    .max(100, "La ciudad no puede exceder los 100 caracteres")
    .optional()
    .nullable(),
    
  telefono: z
    .string({ message: "El teléfono debe ser texto" })
    .max(20, "El teléfono no puede exceder los 20 caracteres")
    .optional()
    .nullable(),
});

// Esquema para la actualización (PATCH)
export const updateSucursalSchema = z.object({
  nombre: z
    .string({ message: "El nombre debe ser texto" })
    .min(1, "El nombre no puede estar vacío")
    .max(150, "El nombre no puede exceder los 150 caracteres")
    .optional(),
    
  direccion: z.string().max(255).optional().nullable(),
  ciudad: z.string().max(100).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  
  activa: z
    .boolean({
      message: "El estado de 'activa' debe ser un valor booleano (true/false)",
    })
    .optional(),
});

// Esquema para solicitud de URL prefirmada de subida de imagen de sede
export const presignImageSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    message: "El tipo de contenido debe ser image/jpeg, image/png o image/webp",
  }),
  fileName: z.string().max(255).optional(),
});

// Esquema para confirmación y validación de subida de imagen de sede
export const confirmImageSchema = z.object({
  uploadToken: z.string().min(1, "El token de subida es obligatorio"),
  tempKey: z.string().min(1, "La clave temporal es obligatoria"),
});
