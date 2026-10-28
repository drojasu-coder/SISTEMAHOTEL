/**
 * Carga idempotente del catálogo comercial aprobado de las 4 sedes de HOTEL HUNAHPÚ.
 *
 * - No borra registros ni modifica reservas, pagos o usuarios.
 * - Reutiliza registros equivalentes existentes y solo crea lo que falta.
 * - Cada bloque lógico (por sede) corre en su propia transacción.
 * - Por defecto es una simulación: ejecuta todo y revierte. Usar --apply para confirmar.
 * - Exige declarar la base y el puerto destino, y aborta si no coinciden.
 *
 * Uso:
 *   npx ts-node scripts/seed-commercial-catalog.ts --expect-db=hotel_db --expect-port=5432 [--apply] [--report=ruta.json]
 *
 * Las credenciales se toman de DATABASE_URL (backend/.env); el script nunca las imprime.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require("../src/models");
const {
  sequelize,
  Sucursal,
  TipoHabitacion,
  Habitacion,
  Mesa,
  Amenidad,
  Salon,
  RecursoActividad,
  ServicioBienestar,
  Terapeuta,
  Restaurante,
  ProductoMenu,
  ReservaActividad,
} = db;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Op } = require("sequelize");

type SedeCode = "ANT" | "ATI" | "XEL" | "CAP";

const SEDES: Record<SedeCode, { ciudad: string; etiqueta: string }> = {
  ANT: { ciudad: "Antigua Guatemala", etiqueta: "Antigua" },
  ATI: { ciudad: "Panajachel", etiqueta: "Atitlán" },
  XEL: { ciudad: "Quetzaltenango", etiqueta: "Xela" },
  CAP: { ciudad: "Ciudad de Guatemala", etiqueta: "Capital" },
};
const CODES = Object.keys(SEDES) as SedeCode[];

// ---------------------------------------------------------------------------
// Habitaciones: el tipo es global con una sola tarifa, por eso cada sede tiene
// sus propios tipos ("Deluxe King · Antigua") para conservar su tarifa aprobada.
// ---------------------------------------------------------------------------
interface Categoria {
  nombre: string;
  capacidad: number;
  camas: string;
  foto: "Doble" | "Suite" | null; // foto de la misma sede ya existente en S3
  cantidad: Record<SedeCode, number>;
  tarifa: Record<SedeCode, number>;
}

const CATEGORIAS: Categoria[] = [
  { nombre: "Deluxe King", capacidad: 2, camas: "una cama king", foto: "Doble",
    cantidad: { ANT: 20, ATI: 18, XEL: 14, CAP: 30 }, tarifa: { ANT: 1250, ATI: 1450, XEL: 1080, CAP: 1650 } },
  { nombre: "Deluxe Twin", capacidad: 2, camas: "dos camas individuales", foto: null,
    cantidad: { ANT: 10, ATI: 8, XEL: 8, CAP: 20 }, tarifa: { ANT: 1250, ATI: 1450, XEL: 1080, CAP: 1650 } },
  { nombre: "Premium", capacidad: 3, camas: "una cama king y una plaza auxiliar", foto: "Doble",
    cantidad: { ANT: 12, ATI: 14, XEL: 10, CAP: 20 }, tarifa: { ANT: 1550, ATI: 1850, XEL: 1380, CAP: 2100 } },
  { nombre: "Junior Suite", capacidad: 3, camas: "una cama king y un sofá cama individual", foto: "Suite",
    cantidad: { ANT: 10, ATI: 10, XEL: 6, CAP: 14 }, tarifa: { ANT: 2050, ATI: 2450, XEL: 1850, CAP: 2750 } },
  { nombre: "Suite", capacidad: 4, camas: "una cama king y un sofá cama doble", foto: "Suite",
    cantidad: { ANT: 7, ATI: 8, XEL: 5, CAP: 10 }, tarifa: { ANT: 2800, ATI: 3400, XEL: 2450, CAP: 3850 } },
  { nombre: "Suite Familiar", capacidad: 5, camas: "una cama king, una cama queen y una cama individual", foto: null,
    cantidad: { ANT: 4, ATI: 4, XEL: 4, CAP: 4 }, tarifa: { ANT: 3200, ATI: 3800, XEL: 2950, CAP: 4400 } },
  { nombre: "Suite Presidencial", capacidad: 4, camas: "dos dormitorios para dos huéspedes cada uno", foto: null,
    cantidad: { ANT: 1, ATI: 2, XEL: 1, CAP: 2 }, tarifa: { ANT: 5500, ATI: 6800, XEL: 4900, CAP: 8500 } },
];

// Las unidades iniciales se conservan y pasan a la categoría equivalente
// (la capacidad nunca disminuye, así que ninguna reserva existente queda inválida).
const TIPO_INICIAL_A_CATEGORIA: Record<string, string> = {
  Individual: "Deluxe Twin",
  Doble: "Deluxe King",
  Suite: "Suite",
};

// ---------------------------------------------------------------------------
// Restaurante: el esquema solo tiene mesas (zona, capacidad) por sede.
// ---------------------------------------------------------------------------
const MESAS: Record<SedeCode, Record<number, number>> = {
  ANT: { 2: 8, 4: 12, 6: 4 },
  ATI: { 2: 6, 4: 12, 6: 4 },
  XEL: { 2: 6, 4: 10, 6: 2 },
  CAP: { 2: 8, 4: 20, 6: 4 },
};

// ---------------------------------------------------------------------------
// Amenidades: "existente" identifica el registro equivalente ya cargado.
// El aforo es un valor operativo de referencia (el modelo lo exige).
// reservable=false: espacio compartido de libre acceso (no admite reservas).
// ---------------------------------------------------------------------------
interface AmenidadPlan { nombre: string; aforo: number; reservable: boolean; existente?: string }
const AMENIDADES: Record<SedeCode, AmenidadPlan[]> = {
  ANT: [
    { nombre: "Piscina climatizada", aforo: 20, reservable: true },
    { nombre: "Terraza panorámica", aforo: 20, reservable: false, existente: "Terraza Mirador del Agua" },
    { nombre: "Gimnasio", aforo: 12, reservable: true },
    { nombre: "Jardines", aforo: 25, reservable: false, existente: "Claustro y Jardín Colonial" },
    { nombre: "Sala de lectura", aforo: 12, reservable: false },
    { nombre: "Área de trabajo", aforo: 10, reservable: true },
  ],
  ATI: [
    { nombre: "Piscina panorámica", aforo: 20, reservable: true, existente: "Piscina y terraza" },
    { nombre: "Jardines tropicales", aforo: 18, reservable: false, existente: "Jardín Zen Mirador de Volcanes" },
    { nombre: "Terrazas de descanso", aforo: 20, reservable: false },
    { nombre: "Gimnasio", aforo: 12, reservable: true },
    { nombre: "Zona de yoga", aforo: 12, reservable: true },
    { nombre: "Sala de lectura", aforo: 12, reservable: false },
    { nombre: "Lounge", aforo: 25, reservable: false },
    { nombre: "Área de trabajo", aforo: 10, reservable: true },
  ],
  XEL: [
    { nombre: "Piscina interior climatizada", aforo: 18, reservable: true },
    { nombre: "Gimnasio", aforo: 10, reservable: true, existente: "Gimnasio y sauna" },
    { nombre: "Lounge con chimenea", aforo: 20, reservable: false },
    { nombre: "Jardines", aforo: 25, reservable: false },
    { nombre: "Sala de lectura", aforo: 14, reservable: false, existente: "Biblioteca y Salón Los Altos" },
    { nombre: "Coworking", aforo: 12, reservable: true },
    { nombre: "Terraza", aforo: 20, reservable: false, existente: "Mirador Panorámico del Valle" },
  ],
  CAP: [
    { nombre: "Piscina en terraza", aforo: 20, reservable: true, existente: "Piscina Climatizada y Solárium" },
    { nombre: "Gimnasio", aforo: 15, reservable: true },
    { nombre: "Centro de negocios", aforo: 12, reservable: true },
    { nombre: "Coworking", aforo: 16, reservable: true },
    { nombre: "Lounge ejecutivo", aforo: 25, reservable: true, existente: "Salón ejecutivo" },
    { nombre: "Terraza", aforo: 30, reservable: false, existente: "Terraza Lounge Urbana Zona 10" },
    { nombre: "Sala de lectura", aforo: 12, reservable: false },
    { nombre: "Jardín interior", aforo: 20, reservable: false },
  ],
};

// Registros anteriores fuera del plan que se conservan como espacios compartidos.
const AMENIDADES_COMPARTIDAS_ANTERIORES: Record<SedeCode, string[]> = {
  ANT: ["Área de descanso"],
  ATI: ["Muelle Privado y Solárium"],
  XEL: [],
  CAP: [],
};

const AMENIDADES_NO_REPRESENTABLES: Record<SedeCode, string[]> = {
  ANT: ["Estacionamiento", "Wi-Fi"],
  ATI: ["Punto de embarque (propuesto, sin instalación autorizada)"],
  XEL: ["Estacionamiento"],
  CAP: ["Estacionamiento", "Wi-Fi"],
};
const MOTIVO_NO_REPRESENTABLE: Record<string, string> = {
  "Wi-Fi": "es un servicio general, no un espacio con aforo; no se registra como amenidad",
  Estacionamiento: "pertenece al módulo de parqueos (sin registros), fuera del alcance de esta carga",
};

// ---------------------------------------------------------------------------
// Restaurante principal por sede y sus 15 productos iniciales (precios en GTQ).
// ---------------------------------------------------------------------------
type CategoriaMenu = "desayuno" | "entrada" | "plato_fuerte" | "postre" | "bebida";
type ProductoPlan = [CategoriaMenu, string, string, number];
const RESTAURANTES: Record<SedeCode, { nombre: string; descripcion: string; productos: ProductoPlan[] }> = {
  ANT: {
    nombre: "Patio de la Ceiba",
    descripcion: "Restaurante principal de la sede Antigua: desayunos, cocina guatemalteca y platos internacionales.",
    productos: [
      ["desayuno", "Desayuno tradicional", "Huevos al gusto, frijoles volteados, plátanos fritos, crema, queso fresco y tortillas.", 95],
      ["desayuno", "Omelette", "Omelette de tres huevos con jamón, queso y vegetales, acompañado de pan tostado.", 85],
      ["desayuno", "Panqueques", "Panqueques con miel, mantequilla y fruta de temporada.", 75],
      ["desayuno", "Desayuno típico premium", "Huevos, longaniza, chirmol, aguacate, frijoles, plátanos, crema, queso y tortillas.", 125],
      ["entrada", "Sopa de tortilla", "Caldo de tomate con tiras de tortilla crujiente, aguacate y queso.", 65],
      ["entrada", "Ensalada de la casa", "Hojas verdes, tomate, pepino y aguacate con vinagreta de limón.", 60],
      ["plato_fuerte", "Pepián", "Pepián de pollo con recado de semillas tostadas, arroz y tamalitos.", 135],
      ["plato_fuerte", "Lomito", "Lomito de res a la parrilla con papas y vegetales salteados.", 185],
      ["plato_fuerte", "Salmón", "Salmón a la plancha con puré de papa y vegetales.", 195],
      ["plato_fuerte", "Pasta vegetariana", "Pasta con vegetales salteados en salsa de tomate y albahaca.", 115],
      ["postre", "Flan", "Flan de vainilla con caramelo.", 45],
      ["postre", "Pastel de chocolate", "Porción de pastel de chocolate con salsa de chocolate.", 50],
      ["bebida", "Café", "Café guatemalteco filtrado.", 22],
      ["bebida", "Chocolate", "Chocolate caliente preparado al estilo tradicional.", 28],
      ["bebida", "Jugo natural", "Jugo de fruta de temporada.", 30],
    ],
  },
  ATI: {
    nombre: "Mirador del Lago",
    descripcion: "Restaurante principal de la sede Atitlán: desayunos, pescados y cocina internacional.",
    productos: [
      ["desayuno", "Desayuno del lago", "Huevos al gusto, frijoles, plátanos, queso fresco, fruta y tortillas.", 105],
      ["desayuno", "Omelette", "Omelette de tres huevos con queso, hongos y vegetales, con pan tostado.", 90],
      ["desayuno", "Panqueques", "Panqueques con miel, mantequilla y fruta de temporada.", 80],
      ["desayuno", "Desayuno guatemalteco", "Huevos, frijoles volteados, plátanos fritos, crema, queso y tortillas.", 110],
      ["entrada", "Crema de ayote", "Crema de ayote con semillas tostadas.", 65],
      ["entrada", "Ensalada", "Hojas verdes, tomate, pepino y aguacate con vinagreta de la casa.", 65],
      ["plato_fuerte", "Pescado a la plancha", "Filete de pescado a la plancha con arroz y vegetales.", 175],
      ["plato_fuerte", "Pollo con hierbas", "Pechuga de pollo a las hierbas con papas y vegetales.", 150],
      ["plato_fuerte", "Lomito", "Lomito de res a la parrilla con papas y vegetales salteados.", 195],
      ["plato_fuerte", "Risotto", "Risotto cremoso de hongos con queso parmesano.", 145],
      ["postre", "Cheesecake", "Cheesecake con salsa de frutos rojos.", 55],
      ["postre", "Postre de chocolate", "Brownie de chocolate con helado de vainilla.", 55],
      ["bebida", "Café", "Café guatemalteco filtrado.", 24],
      ["bebida", "Chocolate", "Chocolate caliente preparado al estilo tradicional.", 30],
      ["bebida", "Jugo", "Jugo de fruta de temporada.", 32],
    ],
  },
  XEL: {
    nombre: "Altos de Xela",
    descripcion: "Restaurante principal de la sede Quetzaltenango: desayunos y cocina del altiplano.",
    productos: [
      ["desayuno", "Desayuno de los Altos", "Huevos al gusto, frijoles, queso fresco, aguacate y tortillas.", 90],
      ["desayuno", "Huevos preparados", "Huevos revueltos, estrellados o rancheros con pan o tortillas.", 70],
      ["desayuno", "Panqueques", "Panqueques con miel, mantequilla y fruta de temporada.", 65],
      ["desayuno", "Desayuno campesino", "Huevos, longaniza, frijoles, plátanos, crema y tortillas.", 95],
      ["entrada", "Sopa de verduras", "Sopa de verduras de temporada.", 50],
      ["entrada", "Ensalada", "Hojas verdes, tomate, pepino y zanahoria con vinagreta de la casa.", 55],
      ["plato_fuerte", "Pepián", "Pepián de pollo con recado de semillas tostadas, arroz y tamalitos.", 120],
      ["plato_fuerte", "Lomito", "Lomito de res a la parrilla con papas y vegetales.", 165],
      ["plato_fuerte", "Pollo con hongos", "Pechuga de pollo en salsa de hongos con arroz.", 125],
      ["plato_fuerte", "Trucha", "Trucha a la plancha con vegetales y papas.", 145],
      ["postre", "Pastel de chocolate", "Porción de pastel de chocolate.", 45],
      ["postre", "Sheca dulce", "Pan dulce tradicional de Quetzaltenango.", 35],
      ["bebida", "Café", "Café guatemalteco filtrado.", 20],
      ["bebida", "Chocolate", "Chocolate caliente preparado al estilo tradicional.", 25],
      ["bebida", "Atol", "Atol caliente del día.", 20],
    ],
  },
  CAP: {
    nombre: "Cobre & Jade",
    descripcion: "Restaurante principal de la sede Capital: desayunos ejecutivos y cocina contemporánea.",
    productos: [
      ["desayuno", "Desayuno ejecutivo", "Huevos al gusto, frijoles, plátanos, queso, fruta, pan y café.", 120],
      ["desayuno", "Huevos benedictinos", "Huevos pochados sobre pan inglés con jamón y salsa holandesa.", 115],
      ["desayuno", "Parfait", "Yogur con granola y fruta de temporada.", 70],
      ["desayuno", "Desayuno continental", "Panes, mantequilla, mermelada, fruta, jugo y café.", 95],
      ["entrada", "Carpaccio", "Láminas finas de res con aceite de oliva, alcaparras y queso parmesano.", 95],
      ["entrada", "Ensalada", "Hojas verdes, tomate cherry, aguacate y vinagreta de la casa.", 75],
      ["plato_fuerte", "Lomito", "Lomito de res a la parrilla con puré de papa y vegetales.", 225],
      ["plato_fuerte", "Pescado", "Filete de pescado del día con arroz y vegetales.", 210],
      ["plato_fuerte", "Pepián contemporáneo", "Versión contemporánea del pepián con pollo, arroz y tamalitos.", 175],
      ["plato_fuerte", "Risotto", "Risotto cremoso de hongos con queso parmesano.", 165],
      ["postre", "Mousse", "Mousse de chocolate.", 60],
      ["postre", "Cheesecake", "Cheesecake con salsa de frutos rojos.", 60],
      ["bebida", "Café", "Café guatemalteco filtrado.", 28],
      ["bebida", "Chocolate", "Chocolate caliente preparado al estilo tradicional.", 32],
      ["bebida", "Jugo", "Jugo de fruta de temporada.", 35],
    ],
  },
};

// ---------------------------------------------------------------------------
// Salones: tarifa_base es el importe completo que cotiza el backend (más servicios).
// Las tarifas nuevas siguen la escala de los salones ya existentes y son de referencia.
// ---------------------------------------------------------------------------
interface SalonPlan { nombre: string; capacidad: number; tarifa: number; existente?: string; descripcion: string }
const SALONES: Record<SedeCode, SalonPlan[]> = {
  ANT: [
    { nombre: "Gran Salón Colonial", capacidad: 120, tarifa: 3500, existente: "Gran Salón Virreinal", descripcion: "" },
    { nombre: "Patio de Celebraciones", capacidad: 70, tarifa: 2500,
      descripcion: "Patio para celebraciones sociales de hasta 70 invitados." },
    { nombre: "Salón Privado", capacidad: 24, tarifa: 1200,
      descripcion: "Salón reservado para reuniones y cenas privadas de hasta 24 invitados." },
  ],
  ATI: [
    { nombre: "Salón Mirador", capacidad: 90, tarifa: 3000, existente: "Salón Panorámico Atitlán", descripcion: "" },
    { nombre: "Terraza de Eventos", capacidad: 60, tarifa: 1600, existente: "Terraza de Eventos El Muelle", descripcion: "" },
    { nombre: "Salón Privado del Lago", capacidad: 25, tarifa: 1200,
      descripcion: "Salón reservado para reuniones y cenas privadas de hasta 25 invitados." },
  ],
  XEL: [
    { nombre: "Salón Altiplano", capacidad: 100, tarifa: 2800, existente: "Salón Imperial Los Altos", descripcion: "" },
    { nombre: "Sala Ejecutiva", capacidad: 30, tarifa: 1400, existente: "Salón Ejecutivo Santa María", descripcion: "" },
  ],
  CAP: [
    { nombre: "Gran Salón HUNAHPÚ", capacidad: 300, tarifa: 8500,
      descripcion: "Salón principal para congresos, galas y celebraciones de hasta 300 invitados." },
    { nombre: "Salón Ejecutivo", capacidad: 100, tarifa: 3500,
      descripcion: "Salón para eventos corporativos y presentaciones de hasta 100 invitados." },
    { nombre: "Sala de Conferencias", capacidad: 40, tarifa: 2200,
      descripcion: "Sala para conferencias y capacitaciones de hasta 40 asistentes." },
    { nombre: "Sala Privada", capacidad: 16, tarifa: 1200,
      descripcion: "Sala para reuniones privadas de hasta 16 asistentes." },
  ],
};

// ---------------------------------------------------------------------------
// Bienestar: servicios y terapeutas son globales en el esquema; el nombre del
// servicio incluye la sede para conservar su precio aprobado.
// ---------------------------------------------------------------------------
type FotoBienestar = "masaje" | "aromaterapia" | "facial" | null;
interface TratamientoPlan { nombre: string; minutos: number; precio: number; foto: FotoBienestar }
const TRATAMIENTOS: Record<SedeCode, TratamientoPlan[]> = {
  ANT: [
    { nombre: "Masaje relajante", minutos: 60, precio: 520, foto: "masaje" },
    { nombre: "Masaje descontracturante", minutos: 60, precio: 590, foto: "masaje" },
    { nombre: "Aromaterapia", minutos: 75, precio: 680, foto: "aromaterapia" },
    { nombre: "Tratamiento facial", minutos: 60, precio: 540, foto: "facial" },
    { nombre: "Piedras calientes", minutos: 75, precio: 720, foto: "masaje" },
  ],
  ATI: [
    { nombre: "Masaje relajante", minutos: 60, precio: 570, foto: "masaje" },
    { nombre: "Piedras calientes", minutos: 75, precio: 720, foto: "masaje" },
    { nombre: "Aromaterapia", minutos: 60, precio: 620, foto: "aromaterapia" },
    { nombre: "Tratamiento facial", minutos: 60, precio: 590, foto: "facial" },
    { nombre: "Masaje de espalda y cuello", minutos: 45, precio: 460, foto: "masaje" },
    { nombre: "Exfoliación corporal", minutos: 75, precio: 750, foto: null },
  ],
  XEL: [
    { nombre: "Masaje relajante", minutos: 60, precio: 480, foto: "masaje" },
    { nombre: "Piedras calientes", minutos: 75, precio: 650, foto: "masaje" },
    { nombre: "Masaje muscular", minutos: 60, precio: 550, foto: "masaje" },
    { nombre: "Tratamiento facial", minutos: 60, precio: 510, foto: "facial" },
  ],
  CAP: [
    { nombre: "Masaje antiestrés", minutos: 60, precio: 650, foto: "masaje" },
    { nombre: "Masaje muscular profundo", minutos: 60, precio: 700, foto: "masaje" },
    { nombre: "Aromaterapia premium", minutos: 75, precio: 750, foto: "aromaterapia" },
    { nombre: "Reflexología", minutos: 45, precio: 480, foto: null },
    { nombre: "Tratamiento facial premium", minutos: 60, precio: 650, foto: "facial" },
    { nombre: "Piedras calientes", minutos: 90, precio: 900, foto: "masaje" },
  ],
};
// Fotografías generales de bienestar ya publicadas, identificadas por el registro que las usa.
const FOTO_BIENESTAR_ORIGEN: Record<Exclude<FotoBienestar, null>, string> = {
  masaje: "Masaje Holístico Maya con Piedras Volcánicas",
  aromaterapia: "Aromaterapia y Envoltura Corporal Calmante",
  facial: "Tratamiento Facial con Botánicos Autóctonos",
};
// Servicios generales anteriores (sin sede): se retiran del catálogo público
// (activo=false) sin borrarlos, porque el catálogo ahora es por sede.
const SERVICIOS_GENERALES_ANTERIORES = [
  "Masaje Holístico Maya con Piedras Volcánicas",
  "Circuito Termal e Hidroterapia Relajante",
  "Tratamiento Facial con Botánicos Autóctonos",
  "Aromaterapia y Envoltura Corporal Calmante",
];
const TERAPEUTAS: Record<SedeCode, number> = { ANT: 4, ATI: 5, XEL: 4, CAP: 7 };
const CABINAS: Record<SedeCode, number> = { ANT: 3, ATI: 4, XEL: 3, CAP: 5 };

// ---------------------------------------------------------------------------
// Actividades del plan: modalidad "experiencia" (duración fija, cupo compartido,
// total = precio por persona × participantes). precio_hora se guarda como el
// equivalente por participante para clientes que aún lo muestran.
// ---------------------------------------------------------------------------
interface ActividadPlan { nombre: string; tipo: string; horas: number; cupo: number; precio: number; existente?: string }
const ACTIVIDADES: Record<SedeCode, ActividadPlan[]> = {
  ANT: [
    { nombre: "Recorrido histórico", tipo: "recorrido", horas: 2, cupo: 12, precio: 210 },
    { nombre: "Experiencia de café", tipo: "gastronomia", horas: 3, cupo: 10, precio: 325 },
    { nombre: "Taller de cocina", tipo: "taller", horas: 2.5, cupo: 8, precio: 425 },
    { nombre: "Taller artesanal", tipo: "taller", horas: 2, cupo: 8, precio: 240 },
    { nombre: "Cerro de la Cruz", tipo: "senderismo", horas: 1.5, cupo: 12, precio: 160 },
    { nombre: "Excursión al Volcán Pacaya", tipo: "excursion", horas: 6, cupo: 8, precio: 725 },
  ],
  ATI: [
    { nombre: "Paseo panorámico en lancha", tipo: "lancha", horas: 2, cupo: 10, precio: 350 },
    { nombre: "Kayak guiado", tipo: "kayak", horas: 1.5, cupo: 6, precio: 225 },
    { nombre: "Paddleboard", tipo: "paddleboard", horas: 1, cupo: 6, precio: 195 },
    { nombre: "Recorrido cultural", tipo: "recorrido", horas: 4, cupo: 10, precio: 425 },
    { nombre: "Senderismo", tipo: "senderismo", horas: 3, cupo: 8, precio: 275, existente: "Senderismo Volcanes de Atitlán" },
    { nombre: "Taller de textiles", tipo: "taller", horas: 2, cupo: 8, precio: 290 },
  ],
  XEL: [
    { nombre: "Recorrido histórico", tipo: "recorrido", horas: 2, cupo: 12, precio: 195 },
    { nombre: "Fuentes Georginas", tipo: "excursion", horas: 4, cupo: 10, precio: 390 },
    { nombre: "Cerro El Baúl", tipo: "senderismo", horas: 2.5, cupo: 10, precio: 225, existente: "Montañismo Cerro del Baúl" },
    { nombre: "Café y chocolate", tipo: "gastronomia", horas: 2, cupo: 10, precio: 275 },
    { nombre: "Experiencia artesanal", tipo: "taller", horas: 3, cupo: 8, precio: 320 },
  ],
  CAP: [
    { nombre: "Recorrido histórico urbano", tipo: "recorrido", horas: 3, cupo: 12, precio: 290 },
    { nombre: "Ruta cultural de museos", tipo: "recorrido", horas: 3, cupo: 10, precio: 350 },
    { nombre: "Experiencia gastronómica", tipo: "gastronomia", horas: 3, cupo: 8, precio: 490 },
    { nombre: "Taller de cocina", tipo: "taller", horas: 2.5, cupo: 8, precio: 550 },
    { nombre: "Arquitectura y arte", tipo: "recorrido", horas: 2.5, cupo: 10, precio: 310 },
  ],
};

// ---------------------------------------------------------------------------
// Infraestructura del script
// ---------------------------------------------------------------------------
const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : "true"] as const;
  }),
);
const APPLY = args.get("apply") === "true";

class DryRunRollback extends Error {}

interface Entry { modulo: string; sede: string; accion: "creado" | "reutilizado" | "actualizado" | "bloqueado"; detalle: string }
const report: Entry[] = [];
const log = (modulo: string, sede: string, accion: Entry["accion"], detalle: string) => {
  report.push({ modulo, sede, accion, detalle });
};

const money = (n: number) => n.toFixed(2);

async function inBlock(nombre: string, sede: SedeCode | "-", fn: (t: any) => Promise<void>) {
  const before = report.length;
  try {
    await sequelize.transaction(async (t: any) => {
      await fn(t);
      if (!APPLY) throw new DryRunRollback();
    });
  } catch (error) {
    if (error instanceof DryRunRollback) return;
    // El bloque se revierte completo: sus entradas no se aplicaron.
    report.splice(before);
    log(nombre, sede, "bloqueado", `Transacción revertida: ${(error as Error).message}`);
  }
}

async function verifyTarget() {
  const expectDb = args.get("expect-db");
  const expectPort = args.get("expect-port");
  if (!expectDb || !expectPort) {
    throw new Error("Indique --expect-db y --expect-port para confirmar la base destino.");
  }
  const [rows] = await sequelize.query(
    "SELECT current_database() AS db, inet_server_port() AS port, current_setting('server_version') AS version",
  );
  const { db, port, version } = (rows as any[])[0];
  const actualPort = String(port ?? "");
  // Dentro de Docker el puerto interno es 5432; se valida contra el puerto publicado de la URL.
  const urlPort = new URL(process.env.DATABASE_URL ?? "postgres://x@localhost:5432/x").port || "5432";
  if (db !== expectDb || urlPort !== expectPort) {
    throw new Error(`Destino inesperado: ${db} en puerto ${urlPort} (se esperaba ${expectDb}:${expectPort}).`);
  }
  console.log(`[catalogo] Base destino: ${db} · puerto publicado ${urlPort} (interno ${actualPort}) · PostgreSQL ${version}`);
  console.log(`[catalogo] Modo: ${APPLY ? "APLICAR" : "SIMULACIÓN (se revierte todo)"}`);
}

async function resolveSedes(): Promise<Record<SedeCode, any>> {
  const result = {} as Record<SedeCode, any>;
  for (const code of CODES) {
    const matches = await Sucursal.findAll({ where: { ciudad: SEDES[code].ciudad } });
    if (matches.length !== 1) {
      throw new Error(`Se esperaba exactamente una sede en ${SEDES[code].ciudad}; hay ${matches.length}.`);
    }
    result[code] = matches[0];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Bloques
// ---------------------------------------------------------------------------
async function loadHabitaciones(code: SedeCode, sede: any) {
  await inBlock("habitaciones", code, async (t) => {
    const etiqueta = SEDES[code].etiqueta;
    const actuales = await Habitacion.findAll({
      where: { sucursal_id: sede.id },
      include: [{ model: TipoHabitacion, required: true }],
      transaction: t,
      lock: { level: t.LOCK.UPDATE, of: Habitacion },
    });

    // Fotografías por sede ya publicadas en S3 (las de las unidades iniciales).
    const fotos: Record<string, string | null> = { Doble: null, Suite: null };
    for (const h of actuales) {
      const tipoNombre = h.TipoHabitacion?.nombre;
      if (tipoNombre in fotos && h.imagen_key && !fotos[tipoNombre]) fotos[tipoNombre] = h.imagen_key;
    }

    const tipos: Record<string, any> = {};
    for (const cat of CATEGORIAS) {
      const nombre = `${cat.nombre} · ${etiqueta}`;
      const descripcion = `Habitación ${cat.nombre} con ${cat.camas}. Capacidad máxima: ${cat.capacidad} huéspedes.`;
      const [tipo, created] = await TipoHabitacion.findOrCreate({
        where: { nombre },
        defaults: {
          nombre,
          capacidad_maxima: cat.capacidad,
          tarifa_noche: money(cat.tarifa[code]),
          descripcion,
          imagen_key: cat.foto ? fotos[cat.foto] : null,
          sucursal_id: sede.id,
          nombre_comercial: cat.nombre,
        },
        transaction: t,
      });
      if (!created && (tipo.capacidad_maxima !== cat.capacidad || Number(tipo.tarifa_noche) !== cat.tarifa[code])) {
        throw new Error(`El tipo "${nombre}" ya existe con capacidad o tarifa distintas; revíselo manualmente.`);
      }
      // La sede y el nombre comercial vienen del plan, no del sufijo del nombre interno.
      if (!created && (tipo.sucursal_id !== sede.id || tipo.nombre_comercial !== cat.nombre)) {
        if (tipo.sucursal_id != null && tipo.sucursal_id !== sede.id) {
          throw new Error(`El tipo "${nombre}" ya pertenece a la sucursal ${tipo.sucursal_id}; revíselo manualmente.`);
        }
        await tipo.update({ sucursal_id: sede.id, nombre_comercial: cat.nombre }, { transaction: t });
        log("tipos_habitacion", code, "actualizado", `${nombre} → sede ${sede.id}, nombre comercial "${cat.nombre}"`);
      }
      log("tipos_habitacion", code, created ? "creado" : "reutilizado",
        `${nombre} · Q${money(cat.tarifa[code])} · ${cat.capacidad} huéspedes${tipo.imagen_key ? "" : " · sin fotografía"}`);
      tipos[cat.nombre] = tipo;
    }

    // Conservar las unidades iniciales asignándolas a su categoría equivalente.
    for (const h of actuales) {
      const destino = TIPO_INICIAL_A_CATEGORIA[h.TipoHabitacion?.nombre];
      if (!destino) continue;
      const nuevo = tipos[destino];
      if (nuevo.capacidad_maxima < h.TipoHabitacion.capacidad_maxima) {
        throw new Error(`La habitación ${h.numero} perdería capacidad al pasar a ${destino}.`);
      }
      const anterior = h.TipoHabitacion.nombre;
      await h.update({ tipo_habitacion_id: nuevo.id }, { transaction: t });
      log("habitaciones", code, "actualizado", `Unidad ${h.numero}: ${anterior} → ${nuevo.nombre} (se conserva la unidad y sus reservas)`);
    }

    const ocupados = new Set(actuales.map((h: any) => h.numero));
    let siguiente = 1;
    const nextNumero = () => {
      let numero: string;
      do numero = `${code}-${String(siguiente++).padStart(3, "0")}`;
      while (ocupados.has(numero));
      ocupados.add(numero);
      return numero;
    };

    for (const cat of CATEGORIAS) {
      const tipo = tipos[cat.nombre];
      const existentes = await Habitacion.count({
        where: { sucursal_id: sede.id, tipo_habitacion_id: tipo.id },
        transaction: t,
      });
      const faltan = Math.max(0, cat.cantidad[code] - existentes);
      if (existentes > 0) log("habitaciones", code, "reutilizado", `${existentes} unidad(es) ${tipo.nombre}`);
      if (existentes > cat.cantidad[code]) {
        log("habitaciones", code, "bloqueado", `${tipo.nombre}: hay ${existentes}, más que las ${cat.cantidad[code]} previstas; no se elimina ninguna`);
      }
      const nuevas = Array.from({ length: faltan }, () => ({
        sucursal_id: sede.id,
        tipo_habitacion_id: tipo.id,
        numero: nextNumero(),
        estado: "disponible",
      }));
      if (nuevas.length) {
        await Habitacion.bulkCreate(nuevas, { transaction: t, validate: true });
        log("habitaciones", code, "creado", `${nuevas.length} × ${tipo.nombre} (${nuevas[0].numero}…${nuevas[nuevas.length - 1].numero})`);
      }
    }
  });
}

async function loadMesas(code: SedeCode, sede: any) {
  await inBlock("mesas", code, async (t) => {
    const actuales = await Mesa.findAll({ where: { sucursal_id: sede.id }, transaction: t, lock: t.LOCK.UPDATE });
    const zonas = [...new Set(actuales.map((m: any) => m.zona as string))].sort();
    if (!zonas.length) throw new Error("La sede no tiene zonas de restaurante registradas para ubicar nuevas mesas.");
    let z = 0;
    for (const [capacidadStr, objetivo] of Object.entries(MESAS[code])) {
      const capacidad = Number(capacidadStr);
      const existentes = actuales.filter((m: any) => m.capacidad === capacidad).length;
      if (existentes) log("mesas", code, "reutilizado", `${existentes} mesa(s) de ${capacidad}`);
      const faltan = Math.max(0, objetivo - existentes);
      const nuevas = Array.from({ length: faltan }, () => ({
        sucursal_id: sede.id, zona: zonas[z++ % zonas.length], capacidad, estado: "disponible",
      }));
      if (nuevas.length) {
        await Mesa.bulkCreate(nuevas, { transaction: t, validate: true });
        log("mesas", code, "creado", `${nuevas.length} mesa(s) de ${capacidad} en zonas existentes`);
      }
    }
    const fuera = actuales.filter((m: any) => !(m.capacidad in MESAS[code]));
    for (const m of fuera) {
      log("mesas", code, "reutilizado", `Mesa existente de ${m.capacidad} (${m.zona}) fuera de la distribución aprobada; se conserva`);
    }
  });
}

async function loadAmenidades(code: SedeCode, sede: any) {
  await inBlock("amenidades", code, async (t) => {
    const planificadas = new Set<string>();
    for (const plan of AMENIDADES[code]) {
      const nombreBuscado = plan.existente ?? plan.nombre;
      let registro = await Amenidad.findOne({ where: { sucursal_id: sede.id, nombre: nombreBuscado }, transaction: t });
      if (!registro && plan.existente) {
        registro = await Amenidad.findOne({ where: { sucursal_id: sede.id, nombre: plan.nombre }, transaction: t });
      }
      const tipo = plan.reservable ? "reservable" : "compartida";
      if (registro) {
        planificadas.add(registro.nombre);
        if (registro.reservable !== plan.reservable) {
          await registro.update({ reservable: plan.reservable }, { transaction: t });
          log("amenidades", code, "actualizado", `${plan.nombre} → "${registro.nombre}" pasa a ${tipo}`);
        } else {
          log("amenidades", code, "reutilizado", `${plan.nombre} → "${registro.nombre}" (aforo ${registro.aforo_maximo}, ${tipo})`);
        }
        continue;
      }
      const creada = await Amenidad.create(
        { sucursal_id: sede.id, nombre: plan.nombre, aforo_maximo: plan.aforo, reservable: plan.reservable },
        { transaction: t },
      );
      planificadas.add(creada.nombre);
      log("amenidades", code, "creado", `${plan.nombre} (aforo de referencia ${plan.aforo}, ${tipo}, sin fotografía)`);
    }
    for (const nombre of AMENIDADES_COMPARTIDAS_ANTERIORES[code]) {
      const registro = await Amenidad.findOne({ where: { sucursal_id: sede.id, nombre }, transaction: t });
      if (!registro) continue;
      planificadas.add(nombre);
      if (registro.reservable) {
        await registro.update({ reservable: false }, { transaction: t });
        log("amenidades", code, "actualizado", `"${nombre}" (fuera del plan) se conserva como compartida`);
      } else {
        log("amenidades", code, "reutilizado", `"${nombre}" (fuera del plan) compartida`);
      }
    }
    for (const nombre of AMENIDADES_NO_REPRESENTABLES[code]) {
      log("amenidades", code, "bloqueado", `${nombre}: ${MOTIVO_NO_REPRESENTABLE[nombre] ?? "no se registra"}`);
    }
    const extra = await Amenidad.findAll({ where: { sucursal_id: sede.id }, transaction: t });
    for (const a of extra) {
      if (!planificadas.has(a.nombre)) log("amenidades", code, "reutilizado", `"${a.nombre}" existente fuera del plan; se conserva sin cambios`);
    }
  });
}

async function loadSalones(code: SedeCode, sede: any) {
  await inBlock("salones", code, async (t) => {
    for (const plan of SALONES[code]) {
      const existente = plan.existente
        ? await Salon.findOne({ where: { sucursal_id: sede.id, nombre: plan.existente }, transaction: t })
        : null;
      const registro = existente ?? (await Salon.findOne({ where: { sucursal_id: sede.id, nombre: plan.nombre }, transaction: t }));
      if (registro) {
        const nota = registro.capacidad_maxima !== plan.capacidad ? ` · capacidad real ${registro.capacidad_maxima} (plan ${plan.capacidad}), no se modifica` : "";
        log("salones", code, "reutilizado", `${plan.nombre} → "${registro.nombre}" · Q${registro.tarifa_base}${nota}`);
        continue;
      }
      await Salon.create({
        sucursal_id: sede.id, nombre: plan.nombre, capacidad_maxima: plan.capacidad,
        tarifa_base: money(plan.tarifa), descripcion: plan.descripcion,
      }, { transaction: t });
      log("salones", code, "creado", `${plan.nombre} · ${plan.capacidad} invitados · tarifa base de referencia Q${money(plan.tarifa)} · sin fotografía`);
    }
  });
}

async function loadBienestar(code: SedeCode, sede: any) {
  await inBlock("bienestar", code, async (t) => {
    const etiqueta = SEDES[code].etiqueta;
    const fotos: Record<string, string | null> = {};
    for (const [clave, origen] of Object.entries(FOTO_BIENESTAR_ORIGEN)) {
      const s = await ServicioBienestar.findOne({ where: { nombre: origen }, transaction: t });
      fotos[clave] = s?.imagen_key ?? null;
    }
    for (const plan of TRATAMIENTOS[code]) {
      // Identidad: sede + nombre comercial. La carga anterior usó el sufijo "· Sede"
      // (cuando el servicio no tenía sede); esos registros se renombran sin recrearse.
      const nombre = plan.nombre;
      const nombreAnterior = `${plan.nombre} · ${etiqueta}`;
      let servicio = await ServicioBienestar.findOne({ where: { sucursal_id: sede.id, nombre }, transaction: t });
      let accion: Entry["accion"] = "reutilizado";
      if (!servicio) {
        servicio = await ServicioBienestar.findOne({ where: { nombre: nombreAnterior }, transaction: t });
        if (servicio) {
          await vincularSede(servicio, sede, nombreAnterior, t);
          await servicio.update({ nombre }, { transaction: t });
          accion = "actualizado";
        }
      }
      if (!servicio) {
        servicio = await ServicioBienestar.create({
          nombre, duracion_minutos: plan.minutos, precio: money(plan.precio),
          imagen_key: plan.foto ? fotos[plan.foto] : null,
          sucursal_id: sede.id,
        }, { transaction: t });
        accion = "creado";
      }
      if (servicio.duracion_minutos !== plan.minutos || Number(servicio.precio) !== plan.precio) {
        throw new Error(`El servicio "${nombre}" de la sede ${sede.id} existe con duración o precio distintos.`);
      }
      log("servicios_bienestar", code, accion,
        `${nombre} (sede ${sede.id}) · ${plan.minutos} min · Q${money(plan.precio)}${accion === "actualizado" ? ` (antes "${nombreAnterior}")` : ""}${servicio.imagen_key ? "" : " · sin fotografía"}`);
    }
    for (let i = 1; i <= TERAPEUTAS[code]; i++) {
      const nombre = `Terapeuta ${etiqueta} ${String(i).padStart(2, "0")}`;
      const [terapeuta, created] = await Terapeuta.findOrCreate({
        where: { nombre },
        defaults: { nombre, activo: true, sucursal_id: sede.id },
        transaction: t,
      });
      const vinculado = await vincularSede(terapeuta, sede, nombre, t);
      log("terapeutas", code, created ? "creado" : vinculado ? "actualizado" : "reutilizado",
        `${nombre} · sede ${sede.id}${vinculado ? " (vinculado a la sede)" : ""} (registro operativo, sin cuenta de acceso)`);
    }
    log("bienestar", code, "bloqueado", `${CABINAS[code]} cabinas: el esquema no modela cabinas; la disponibilidad se controla por terapeuta`);
  });
}

/** Asigna la sede a un registro sin sede; un registro ya asignado a otra sede detiene el bloque. */
async function vincularSede(registro: any, sede: any, nombre: string, t: any): Promise<boolean> {
  if (registro.sucursal_id === sede.id) return false;
  if (registro.sucursal_id != null) {
    throw new Error(`"${nombre}" ya pertenece a la sucursal ${registro.sucursal_id}; revíselo manualmente.`);
  }
  await registro.update({ sucursal_id: sede.id }, { transaction: t });
  return true;
}

async function retirarServiciosGenerales() {
  await inBlock("bienestar", "-", async (t) => {
    for (const nombre of SERVICIOS_GENERALES_ANTERIORES) {
      const servicio = await ServicioBienestar.findOne({ where: { nombre, sucursal_id: null }, transaction: t });
      if (!servicio) continue;
      if (servicio.activo) {
        await servicio.update({ activo: false }, { transaction: t });
        log("servicios_bienestar", "-", "actualizado", `"${nombre}" (general, sin sede) retirado del catálogo público; se conserva`);
      } else {
        log("servicios_bienestar", "-", "reutilizado", `"${nombre}" (general, sin sede) ya retirado del catálogo público`);
      }
    }
  });
}

async function loadRestaurante(code: SedeCode, sede: any) {
  await inBlock("restaurante", code, async (t) => {
    const plan = RESTAURANTES[code];
    const [restaurante, created] = await Restaurante.findOrCreate({
      where: { sucursal_id: sede.id },
      defaults: { sucursal_id: sede.id, nombre: plan.nombre, descripcion: plan.descripcion, activo: true },
      transaction: t,
    });
    if (!created && restaurante.nombre !== plan.nombre) {
      log("restaurante", code, "reutilizado", `Restaurante existente "${restaurante.nombre}" (plan: ${plan.nombre}); no se renombra`);
    } else {
      log("restaurante", code, created ? "creado" : "reutilizado", `${plan.nombre} (id ${restaurante.id})`);
    }

    const [vinculadas] = await Mesa.update(
      { restaurante_id: restaurante.id },
      { where: { sucursal_id: sede.id, restaurante_id: null }, transaction: t },
    );
    const otras = await Mesa.count({
      where: { sucursal_id: sede.id, restaurante_id: { [Op.ne]: restaurante.id } },
      transaction: t,
    });
    if (otras > 0) throw new Error(`${otras} mesa(s) de la sede están vinculadas a otro restaurante.`);
    log("mesas", code, vinculadas ? "actualizado" : "reutilizado",
      vinculadas ? `${vinculadas} mesa(s) vinculadas a ${restaurante.nombre}` : `Mesas ya vinculadas a ${restaurante.nombre}`);

    let creados = 0;
    for (const [i, [categoria, nombre, descripcion, precio]] of plan.productos.entries()) {
      const [producto, nuevo] = await ProductoMenu.findOrCreate({
        where: { restaurante_id: restaurante.id, nombre },
        defaults: { restaurante_id: restaurante.id, categoria, nombre, descripcion, precio: money(precio), disponible: true, orden: i + 1 },
        transaction: t,
      });
      if (!nuevo && (producto.categoria !== categoria || Number(producto.precio) !== precio)) {
        log("menu", code, "reutilizado", `${nombre}: existe con categoría o precio distintos; no se sobrescribe`);
      }
      if (nuevo) creados++;
    }
    log("menu", code, creados ? "creado" : "reutilizado",
      `${creados ? `${creados} producto(s) nuevos` : "Productos ya cargados"} de ${plan.productos.length} en ${restaurante.nombre}`);
  });
}

async function loadActividades(code: SedeCode, sede: any) {
  await inBlock("actividades", code, async (t) => {
    for (const plan of ACTIVIDADES[code]) {
      if (plan.existente) {
        const anterior = await RecursoActividad.findOne({ where: { sucursal_id: sede.id, nombre: plan.existente }, transaction: t });
        if (anterior) {
          log("actividades", code, "reutilizado",
            `"${anterior.nombre}" (anterior, por hora Q${anterior.precio_hora}) se conserva sin cambios junto a la experiencia del plan`);
        }
      }
      const experiencia = {
        tipo: plan.tipo,
        modalidad: "experiencia",
        duracion_minutos: Math.round(plan.horas * 60),
        cupo_maximo: plan.cupo,
        precio_persona: money(plan.precio),
        precio_hora: money(Math.round((plan.precio / plan.horas) * 100) / 100),
        precio_equipo: "0.00",
        precio_instructor_hora: "0.00",
      };
      const detalle = `${plan.nombre} · ${plan.horas} h · cupo ${plan.cupo} · Q${money(plan.precio)} por persona`;
      const [recurso, created] = await RecursoActividad.findOrCreate({
        where: { sucursal_id: sede.id, nombre: plan.nombre },
        defaults: { sucursal_id: sede.id, nombre: plan.nombre, ...experiencia },
        transaction: t,
      });
      if (created) {
        log("actividades", code, "creado", detalle);
        continue;
      }
      if (recurso.modalidad === "experiencia") {
        log("actividades", code, "reutilizado", detalle);
        continue;
      }
      // Recurso por hora creado en la carga anterior: se convierte si no tiene reservas confirmadas.
      const confirmadas = await ReservaActividad.count({ where: { recurso_id: recurso.id, estado: "confirmada" }, transaction: t });
      if (confirmadas > 0) {
        log("actividades", code, "bloqueado", `${plan.nombre}: tiene ${confirmadas} reserva(s) confirmada(s) por hora; no se cambia la modalidad`);
        continue;
      }
      const precioHoraAnterior = recurso.precio_hora;
      await recurso.update(experiencia, { transaction: t });
      log("actividades", code, "actualizado", `${detalle} (antes por hora Q${precioHoraAnterior}/h)`);
    }
  });
}

async function main() {
  await verifyTarget();
  const sedes = await resolveSedes();
  for (const code of CODES) log("sucursales", code, "reutilizado", `${sedes[code].nombre} (id ${sedes[code].id})`);

  // Orden de prioridad acordado; cada bloque es independiente.
  for (const code of CODES) await loadHabitaciones(code, sedes[code]);
  for (const code of CODES) await loadMesas(code, sedes[code]);
  for (const code of CODES) await loadRestaurante(code, sedes[code]);
  for (const code of CODES) log("restaurante", code, "bloqueado", "Horarios o turnos de servicio: no existen en el esquema");
  for (const code of CODES) await loadBienestar(code, sedes[code]);
  await retirarServiciosGenerales();
  for (const code of CODES) await loadActividades(code, sedes[code]);
  for (const code of CODES) await loadAmenidades(code, sedes[code]);
  for (const code of CODES) await loadSalones(code, sedes[code]);

  const resumen: Record<string, Record<string, number>> = {};
  for (const e of report) {
    resumen[e.modulo] ??= {};
    resumen[e.modulo][e.accion] = (resumen[e.modulo][e.accion] ?? 0) + 1;
  }
  for (const e of report) console.log(`${e.accion.padEnd(11)} ${e.modulo.padEnd(19)} ${e.sede}  ${e.detalle}`);
  console.log("\nResumen (entradas por módulo y acción):", JSON.stringify(resumen, null, 2));

  const reportPath = args.get("report");
  if (reportPath) {
    fs.writeFileSync(reportPath, JSON.stringify({ aplicado: APPLY, entradas: report }, null, 2));
    console.log(`[catalogo] Informe escrito en ${reportPath}`);
  }
}

main()
  .catch((error) => {
    console.error(`[catalogo] Error: ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
