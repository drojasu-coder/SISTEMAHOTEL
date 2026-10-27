import { z } from "zod";

export const updateInicioSchema = z.object({
  hero_titulo: z
    .string()
    .min(1, "El título principal es obligatorio")
    .max(255, "El título no puede exceder 255 caracteres")
    .optional(),
  hero_subtitulo: z.string().optional(),
  hero_imagen_alt: z.string().max(255).optional(),
  hero_cta_texto: z.string().max(100).optional(),
  hero_cta_enlace: z.string().max(255).optional(),

  presentacion_titulo: z.string().max(255).optional(),
  presentacion_texto: z.string().optional(),
  presentacion_imagen_alt: z.string().max(255).optional(),
  presentacion_visible: z.boolean().optional(),

  sedes_titulo: z.string().max(255).optional(),
  sedes_subtitulo: z.string().optional(),
  sedes_visible: z.boolean().optional(),

  experiencias_titulo: z.string().max(255).optional(),
  experiencias_subtitulo: z.string().optional(),
  experiencias_imagen_alt: z.string().max(255).optional(),
  experiencias_visible: z.boolean().optional(),

  contacto_titulo: z.string().max(255).optional(),
  contacto_texto: z.string().optional(),
  contacto_telefono: z.string().max(50).optional(),
  contacto_email: z.string().max(100).optional(),
  contacto_direccion: z.string().max(255).optional(),
  contacto_visible: z.boolean().optional(),
});

export const presignInicioImageSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    message: "El tipo de contenido debe ser image/jpeg, image/png o image/webp",
  }),
  fileName: z.string().max(255).optional(),
});

export const confirmInicioImageSchema = z.object({
  uploadToken: z.string().min(1, "El token de subida es obligatorio"),
  tempKey: z.string().min(1, "La clave temporal es obligatoria"),
});
