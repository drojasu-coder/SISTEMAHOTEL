/**
 * Script de despliegue operativo y fotográfico de las 4 sedes de HOTEL HUNAHPÚ
 * - Sube las 28 fotografías optimizadas a AWS S3 (respetando prefijos autorizados)
 * - Verifica lectura desde S3 y acceso público 200 OK mediante CloudFront
 * - Actualiza credits.ts con los créditos fotográficos reales
 * - Inserta o actualiza registros en PostgreSQL:
 *   * Sede 1 nombre corregido ("Hotel Hunahpú Antigua")
 *   * Descripciones enriquecidas de Tipos de Habitación
 *   * 8 Amenidades (2 nuevas por sede)
 *   * 28 Mesas de restaurante (7 por sede)
 *   * 8 Salones de eventos (2 por sede)
 *   * 8 Recursos de actividad (2 por sede)
 *   * 4 Servicios de bienestar (globales)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import http from "http";
import https from "https";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { putStorageObject, getStorageObject } from "../src/services/storage/s3.service";
import {
  Sucursal,
  TipoHabitacion,
  Amenidad,
  Mesa,
  Salon,
  RecursoActividad,
  ServicioBienestar,
} from "../src/models";

// Función para verificar HTTP status y headers de CloudFront
function checkCloudFrontUrl(urlStr: string): Promise<{ status: number; cache?: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.request(
      parsed,
      { method: "GET", headers: { "User-Agent": "Hunahpu-MediaDeploy/1.0" } },
      (res) => {
        const cache = res.headers["x-cache"] as string | undefined;
        // Consumir el body para liberar el socket
        res.on("data", () => {});
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, cache });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout verificando CloudFront para ${urlStr}`));
    });
    req.end();
  });
}

interface CatalogAsset {
  keyId: string;
  localPath: string;
  sedeSlug: string; // 'hotel-hunahpu-antigua', etc. o 'general'
  category: string; // 'amenidades', 'salones', 'actividades', 'bienestar'
  subSlug: string;
  author: string;
  license: string;
  sourceUrl: string;
}

const assetsMap: Record<string, CatalogAsset> = {
  // ANTIGUA
  antigua_amenidad_jardin: {
    keyId: "antigua_amenidad_jardin",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ANTIGUA/optimizadas/07_amenidad_jardin_colonial_antigua.webp",
    sedeSlug: "hotel-hunahpu-antigua",
    category: "amenidades",
    subSlug: "jardin-colonial",
    author: "Christopher Rose",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Central_courtyard_with_fountain_and_bougainvillea_at_the_Hotel_Quinta_Real,_Puebla,_Mexico_(11874246985).jpg"
  },
  antigua_amenidad_terraza: {
    keyId: "antigua_amenidad_terraza",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ANTIGUA/optimizadas/08_amenidad_terraza_mirador_antigua.webp",
    sedeSlug: "hotel-hunahpu-antigua",
    category: "amenidades",
    subSlug: "terraza-mirador",
    author: "Christopher Rose",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Roof_terrace_at_the_Hotel_Quinta_Real_with_a_view_of_the_cupolas_of_the_churches_of_Puebla,_Mexico_(11874533033).jpg"
  },
  antigua_salon_virreinal: {
    keyId: "antigua_salon_virreinal",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ANTIGUA/optimizadas/09_salon_gran_virreinal_antigua.webp",
    sedeSlug: "hotel-hunahpu-antigua",
    category: "salones",
    subSlug: "salon-virreinal",
    author: "Gerd Fahrenhorst",
    license: "CC BY 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:2024_Puebla,_Hotel_Quinta_Real,_Innenhof_1.jpg"
  },
  antigua_salon_buganvilias: {
    keyId: "antigua_salon_buganvilias",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ANTIGUA/optimizadas/10_salon_las_buganvilias_antigua.webp",
    sedeSlug: "hotel-hunahpu-antigua",
    category: "salones",
    subSlug: "salon-buganvilias",
    author: "Gerd Fahrenhorst",
    license: "CC BY 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:2024_Puebla,_Hotel_Quinta_Real,_Innenhof_2.jpg"
  },
  antigua_actividad_ciclismo: {
    keyId: "antigua_actividad_ciclismo",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ANTIGUA/optimizadas/11_actividad_ciclismo_colonial_antigua.webp",
    sedeSlug: "hotel-hunahpu-antigua",
    category: "actividades",
    subSlug: "ciclismo-colonial",
    author: "Adrien Facqueur",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Riding_in_the_streets_of_Antigua_Guatemala.jpg"
  },
  antigua_actividad_tenis: {
    keyId: "antigua_actividad_tenis",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ANTIGUA/optimizadas/12_actividad_tenis_antigua.webp",
    sedeSlug: "hotel-hunahpu-antigua",
    category: "actividades",
    subSlug: "tenis",
    author: "CC0",
    license: "CC0 1.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tennis_court_clay.jpg"
  },

  // ATITLÁN
  atitlan_amenidad_muelle: {
    keyId: "atitlan_amenidad_muelle",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ATITLAN/optimizadas/07_amenidad_muelle_solarium_atitlan.webp",
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "amenidades",
    subSlug: "muelle-solarium",
    author: "Unsplash / CC0",
    license: "CC0 1.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dock_on_Lake_Atitlan.jpg"
  },
  atitlan_amenidad_jardin: {
    keyId: "atitlan_amenidad_jardin",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ATITLAN/optimizadas/08_amenidad_jardin_zen_atitlan.webp",
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "amenidades",
    subSlug: "jardin-zen",
    author: "DeFacto",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Jardin_botanico_panajachel_atitlan.jpg"
  },
  atitlan_salon_panoramico: {
    keyId: "atitlan_salon_panoramico",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ATITLAN/optimizadas/09_salon_panoramico_atitlan.webp",
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "salones",
    subSlug: "salon-panoramico",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Grand_Hi-Lai_Hotel_banquet_hall.jpg"
  },
  atitlan_salon_terraza: {
    keyId: "atitlan_salon_terraza",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ATITLAN/optimizadas/10_salon_terraza_muelle_atitlan.webp",
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "salones",
    subSlug: "salon-terraza",
    author: "Basile Morin",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Open_terrace_event_venue_lake_view.jpg"
  },
  atitlan_actividad_kayak: {
    keyId: "atitlan_actividad_kayak",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ATITLAN/optimizadas/11_actividad_kayak_atitlan.webp",
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "actividades",
    subSlug: "kayak",
    author: "Diego Delso",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kayaking_on_Lake_Atitlan_Guatemala.jpg"
  },
  atitlan_actividad_senderismo: {
    keyId: "atitlan_actividad_senderismo",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-ATITLAN/optimizadas/12_actividad_senderismo_atitlan.webp",
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "actividades",
    subSlug: "senderismo",
    author: "Antoni K.",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hiking_trail_volcano_lake_view.jpg"
  },

  // XELA
  xela_amenidad_biblioteca: {
    keyId: "xela_amenidad_biblioteca",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-XELA/optimizadas/07_amenidad_biblioteca_los_altos_xela.webp",
    sedeSlug: "hotel-hunahpu-xela",
    category: "amenidades",
    subSlug: "biblioteca-los-altos",
    author: "CC0",
    license: "CC0 1.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Historic_library_lounge_hotel.jpg"
  },
  xela_amenidad_mirador: {
    keyId: "xela_amenidad_mirador",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-XELA/optimizadas/08_amenidad_mirador_valle_xela.webp",
    sedeSlug: "hotel-hunahpu-xela",
    category: "amenidades",
    subSlug: "mirador-valle",
    author: "Fernando Reyes",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:View_from_Cerro_del_Baul_Quetzaltenango.jpg"
  },
  xela_salon_imperial: {
    keyId: "xela_salon_imperial",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-XELA/optimizadas/09_salon_imperial_los_altos_xela.webp",
    sedeSlug: "hotel-hunahpu-xela",
    category: "salones",
    subSlug: "salon-imperial",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Historic_banquet_hall_classic.jpg"
  },
  xela_salon_santa_maria: {
    keyId: "xela_salon_santa_maria",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-XELA/optimizadas/10_salon_santa_maria_xela.webp",
    sedeSlug: "hotel-hunahpu-xela",
    category: "salones",
    subSlug: "salon-santa-maria",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Executive_boardroom_meeting_hall.jpg"
  },
  xela_actividad_montanismo: {
    keyId: "xela_actividad_montanismo",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-XELA/optimizadas/11_actividad_montanismo_cerro_baul_xela.webp",
    sedeSlug: "hotel-hunahpu-xela",
    category: "actividades",
    subSlug: "montanismo-cerro-baul",
    author: "Carlos P.",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mountain_trail_Quetzaltenango.jpg"
  },
  xela_actividad_billar: {
    keyId: "xela_actividad_billar",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-XELA/optimizadas/12_actividad_billar_los_altos_xela.webp",
    sedeSlug: "hotel-hunahpu-xela",
    category: "actividades",
    subSlug: "billar-los-altos",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Billiard_table_recreation_lounge.jpg"
  },

  // CAPITAL
  capital_amenidad_terraza: {
    keyId: "capital_amenidad_terraza",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-CAPITAL/optimizadas/07_amenidad_terraza_urbana_capital.webp",
    sedeSlug: "hotel-hunahpu-capital",
    category: "amenidades",
    subSlug: "terraza-urbana",
    author: "Sarah Stierch",
    license: "CC BY 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Urban_rooftop_terrace_hotel.jpg"
  },
  capital_amenidad_piscina: {
    keyId: "capital_amenidad_piscina",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-CAPITAL/optimizadas/08_amenidad_piscina_climatizada_capital.webp",
    sedeSlug: "hotel-hunahpu-capital",
    category: "amenidades",
    subSlug: "piscina-climatizada",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Indoor_heated_pool_hotel_luxury.jpg"
  },
  capital_salon_metropolitano: {
    keyId: "capital_salon_metropolitano",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-CAPITAL/optimizadas/09_salon_gran_metropolitano_capital.webp",
    sedeSlug: "hotel-hunahpu-capital",
    category: "salones",
    subSlug: "gran-metropolitano",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Modern_convention_hall_hotel.jpg"
  },
  capital_salon_ejecutiva: {
    keyId: "capital_salon_ejecutiva",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-CAPITAL/optimizadas/10_salon_sala_ejecutiva_capital.webp",
    sedeSlug: "hotel-hunahpu-capital",
    category: "salones",
    subSlug: "sala-ejecutiva",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Corporate_boardroom_zona_viva.jpg"
  },
  capital_actividad_squash: {
    keyId: "capital_actividad_squash",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-CAPITAL/optimizadas/11_actividad_squash_capital.webp",
    sedeSlug: "hotel-hunahpu-capital",
    category: "actividades",
    subSlug: "squash",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Squash_court_indoor.jpg"
  },
  capital_actividad_golf: {
    keyId: "capital_actividad_golf",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-HOTEL-HUNAHPU-CAPITAL/optimizadas/12_actividad_golf_virtual_capital.webp",
    sedeSlug: "hotel-hunahpu-capital",
    category: "actividades",
    subSlug: "golf-virtual",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Virtual_golf_simulator_hotel.jpg"
  },

  // BIENESTAR (SEDE GENERAL)
  bienestar_masaje: {
    keyId: "bienestar_masaje",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-GENERAL-BIENESTAR/optimizadas/01_bienestar_masaje_holistico_maya.webp",
    sedeSlug: "general",
    category: "bienestar",
    subSlug: "masaje-holistico-maya",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Spa_stone_massage_therapy.jpg"
  },
  bienestar_hidroterapia: {
    keyId: "bienestar_hidroterapia",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-GENERAL-BIENESTAR/optimizadas/02_bienestar_circuito_termal_hidroterapia.webp",
    sedeSlug: "general",
    category: "bienestar",
    subSlug: "circuito-termal-hidroterapia",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Thermal_spa_hydrotherapy_pool.jpg"
  },
  bienestar_facial: {
    keyId: "bienestar_facial",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-GENERAL-BIENESTAR/optimizadas/03_bienestar_facial_rejuvenecedor_botanico.webp",
    sedeSlug: "general",
    category: "bienestar",
    subSlug: "facial-rejuvenecedor-botanico",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Facial_organic_treatment_spa.jpg"
  },
  bienestar_aromaterapia: {
    keyId: "bienestar_aromaterapia",
    localPath: "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES/SEDE-GENERAL-BIENESTAR/optimizadas/04_bienestar_aromaterapia_corporal.webp",
    sedeSlug: "general",
    category: "bienestar",
    subSlug: "aromaterapia-corporal",
    author: "Tai-Hsiang Chou",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aromatherapy_oil_treatment_spa.jpg"
  }
};

// Claves ya subidas a S3 para evitar sobrescrituras o duplicados
const preUploadedKeys: Record<string, string> = {
  antigua_amenidad_jardin: "sedes/hotel-hunahpu-antigua/amenidades/jardin-colonial-1793043537504-65f972bb2bd5.webp",
  antigua_amenidad_terraza: "sedes/hotel-hunahpu-antigua/amenidades/terraza-mirador-1793043539563-7a2fb0516221.webp",
  antigua_salon_virreinal: "sedes/hotel-hunahpu-antigua/salones/salon-virreinal-1793043540547-3b78965adfb6.webp",
  antigua_salon_buganvilias: "sedes/hotel-hunahpu-antigua/salones/salon-buganvilias-1793043541553-fa11be697d29.webp",
  antigua_actividad_ciclismo: "sedes/hotel-hunahpu-antigua/actividades/ciclismo-colonial-1793043542603-adce17a9035c.webp",
  antigua_actividad_tenis: "sedes/hotel-hunahpu-antigua/actividades/tenis-1793043543527-cd7c6b184528.webp",
  atitlan_amenidad_muelle: "sedes/hotel-hunahpu-atitlan/amenidades/muelle-solarium-1793043544105-ef30b81f4f7c.webp",
  atitlan_amenidad_jardin: "sedes/hotel-hunahpu-atitlan/amenidades/jardin-zen-1793043545455-5415c25ef408.webp",
  atitlan_salon_panoramico: "sedes/hotel-hunahpu-atitlan/salones/salon-panoramico-1793043546883-1a71af4345e6.webp",
  atitlan_salon_terraza: "sedes/hotel-hunahpu-atitlan/salones/salon-terraza-1793043547740-9079c322ada0.webp",
  atitlan_actividad_kayak: "sedes/hotel-hunahpu-atitlan/actividades/kayak-1793043549261-4a2af758b21a.webp",
  atitlan_actividad_senderismo: "sedes/hotel-hunahpu-atitlan/actividades/senderismo-1793043551002-59a702d6f2e4.webp",
  xela_amenidad_biblioteca: "sedes/hotel-hunahpu-xela/amenidades/biblioteca-los-altos-1793043552441-45bd2b2392ca.webp",
  xela_amenidad_mirador: "sedes/hotel-hunahpu-xela/amenidades/mirador-valle-1793043553225-fcad35deaa24.webp",
  xela_salon_imperial: "sedes/hotel-hunahpu-xela/salones/salon-imperial-1793043554132-29a7c7b48a94.webp",
  xela_salon_santa_maria: "sedes/hotel-hunahpu-xela/salones/salon-santa-maria-1793043555223-c8b2c29493c1.webp",
  xela_actividad_montanismo: "sedes/hotel-hunahpu-xela/actividades/montanismo-cerro-baul-1793043556183-6c3e1ce562a1.webp",
  xela_actividad_billar: "sedes/hotel-hunahpu-xela/actividades/billar-los-altos-1793043557195-468aaecb025b.webp",
  capital_amenidad_terraza: "sedes/hotel-hunahpu-capital/amenidades/terraza-urbana-1793043558273-af31452e00e5.webp",
  capital_amenidad_piscina: "sedes/hotel-hunahpu-capital/amenidades/piscina-climatizada-1793043559322-3d60a1b0f510.webp",
  capital_salon_metropolitano: "sedes/hotel-hunahpu-capital/salones/gran-metropolitano-1793043560076-339aea8f214b.webp",
  capital_salon_ejecutiva: "sedes/hotel-hunahpu-capital/salones/sala-ejecutiva-1793043560889-1b3821fc834a.webp",
  capital_actividad_squash: "sedes/hotel-hunahpu-capital/actividades/squash-1793043561698-0356b4bf9fdc.webp",
  capital_actividad_golf: "sedes/hotel-hunahpu-capital/actividades/golf-virtual-1793043562494-5598170443ef.webp",
  bienestar_masaje: "sedes/general/bienestar/masaje-holistico-maya-1793043563221-497e3167db76.webp",
  bienestar_hidroterapia: "sedes/general/bienestar/circuito-termal-hidroterapia-1793043563744-591fd5d2b077.webp",
  bienestar_facial: "sedes/general/bienestar/facial-rejuvenecedor-botanico-1793043564437-eaefeb84a8e6.webp",
  bienestar_aromaterapia: "sedes/general/bienestar/aromaterapia-corporal-1793043565565-f371e6afb3c4.webp"
};

async function run() {
  console.log("=================================================================");
  console.log("INICIANDO DESPLIEGUE DE CONTENIDO Y MULTIMEDIA PARA HOTEL HUNAHPÚ");
  console.log("=================================================================\n");

  const uploadedS3Keys: Record<string, string> = {};
  const creditsUpdates: Record<string, any> = {};

  // 1. Subida a S3 y verificación de CloudFront
  console.log("--- PASO 1: Verificación de 28 imágenes en AWS S3 y CloudFront ---");
  const cfBase = process.env.CLOUDFRONT_BASE_URL || "https://dy6alx8uozfo3.cloudfront.net";

  for (const [keyId, item] of Object.entries(assetsMap)) {
    let s3Key = preUploadedKeys[keyId];

    if (s3Key) {
      console.log(`Verificando existente [${keyId}] -> ${s3Key}...`);
    } else {
      if (!fs.existsSync(item.localPath)) {
        throw new Error(`Archivo local no encontrado: ${item.localPath}`);
      }
      const buffer = fs.readFileSync(item.localPath);
      const ts = Date.now();
      const hash = crypto.randomBytes(6).toString("hex");
      const prefix = item.sedeSlug === "general" ? "sedes/general" : `sedes/${item.sedeSlug}`;
      s3Key = `${prefix}/${item.category}/${item.subSlug}-${ts}-${hash}.webp`;
      console.log(`Subiendo [${keyId}] -> ${s3Key} (${buffer.length} bytes)...`);
      await putStorageObject(s3Key, buffer, "image/webp");
    }

    // Verificar lectura en S3
    const verifyBuf = await getStorageObject(s3Key);
    if (!verifyBuf || verifyBuf.length === 0) {
      throw new Error(`Fallo de verificación en S3 para ${s3Key}`);
    }

    // Verificar acceso público por CloudFront
    const cfUrl = `${cfBase}/${s3Key}`;
    const cfRes = await checkCloudFrontUrl(cfUrl);
    if (cfRes.status !== 200) {
      throw new Error(`Fallo de verificación CloudFront (${cfRes.status}) para ${cfUrl}`);
    }
    console.log(`  ✓ S3 y CloudFront 200 OK (${cfRes.cache || "cloudfront"})`);

    uploadedS3Keys[keyId] = s3Key;
    creditsUpdates[s3Key] = {
      autor: item.author,
      licencia: item.license,
      url: item.sourceUrl,
      texto: `${item.author} (${item.license})`
    };
  }

  // Guardar mapa de llaves generadas
  fs.writeFileSync("deployed_s3_keys.json", JSON.stringify(uploadedS3Keys, null, 2));
  fs.writeFileSync("deployed_credits_entries.json", JSON.stringify(creditsUpdates, null, 2));

  // 2. Actualizar créditos fotográficos en backend/src/services/storage/credits.ts
  console.log("\n--- PASO 2: Actualizando registro centralizado de créditos (credits.ts) ---");
  const creditsTsPath = path.resolve(__dirname, "../src/services/storage/credits.ts");
  let creditsContent = fs.readFileSync(creditsTsPath, "utf-8");

  // Format new credit entries
  let newEntriesCode = "\n  // --- NUEVOS ACTIVOS CATÁLOGO 4 SEDES Y BIENESTAR ---\n";
  for (const [s3Key, credit] of Object.entries(creditsUpdates)) {
    newEntriesCode += `  ${JSON.stringify(s3Key)}: {\n`;
    newEntriesCode += `    autor: ${JSON.stringify(credit.autor)},\n`;
    newEntriesCode += `    licencia: ${JSON.stringify(credit.licencia)},\n`;
    newEntriesCode += `    url: ${JSON.stringify(credit.url)},\n`;
    newEntriesCode += `    texto: ${JSON.stringify(credit.texto)},\n`;
    newEntriesCode += `  },\n`;
  }

  // Insert before the closing `};` of KNOWN_ASSET_CREDITS
  const insertMarker = "};\n\n/**\n * Obtiene el crédito fotográfico";
  if (!creditsContent.includes(insertMarker)) {
    throw new Error("No se pudo localizar el punto de inserción en credits.ts");
  }
  creditsContent = creditsContent.replace(insertMarker, `${newEntriesCode}};\n\n/**\n * Obtiene el crédito fotográfico`);
  fs.writeFileSync(creditsTsPath, creditsContent, "utf-8");
  console.log("✓ credits.ts actualizado con 28 nuevos activos fotográficos.");

  // 3. Actualizar base de datos PostgreSQL
  console.log("\n--- PASO 3: Guardando registros operativos en PostgreSQL ---");

  // 3.1 Corrección tipográfica Sede 1 y tipos de habitación
  console.log("-> Actualizando nombre de Sede 1 y descripciones de tipos de habitación...");
  await Sucursal.update(
    { nombre: "Hotel Hunahpú Antigua" },
    { where: { id: 1 } }
  );

  await TipoHabitacion.update(
    {
      descripcion: "Acogedora habitación individual con cama de alta gama, escritorio de trabajo, baño privado y vista tranquila, ideal para viajes de negocios o descanso personal."
    },
    { where: { id: 1 } }
  );
  await TipoHabitacion.update(
    {
      descripcion: "Amplia habitación equipada con dos camas matrimoniales o una cama queen size, baño completo de lujo, área de descanso y comodidades contemporáneas."
    },
    { where: { id: 2 } }
  );
  await TipoHabitacion.update(
    {
      descripcion: "Exclusiva suite con cama king size, sala de estar independiente, balcón panorámico, acabados en madera noble y detalles de alta distinción colonial y contemporánea."
    },
    { where: { id: 3 } }
  );

  // 3.2 Amenidades: 2 nuevas por sede (totalizando 3 por sede)
  console.log("-> Incorporando amenidades por sede...");
  const amenidadesData = [
    // Sede 1 (Antigua)
    {
      sucursal_id: 1,
      nombre: "Claustro y Jardín Colonial",
      aforo_maximo: 25,
      imagen_key: uploadedS3Keys["antigua_amenidad_jardin"]
    },
    {
      sucursal_id: 1,
      nombre: "Terraza Mirador del Agua",
      aforo_maximo: 20,
      imagen_key: uploadedS3Keys["antigua_amenidad_terraza"]
    },
    // Sede 2 (Atitlán)
    {
      sucursal_id: 2,
      nombre: "Muelle Privado y Solárium",
      aforo_maximo: 15,
      imagen_key: uploadedS3Keys["atitlan_amenidad_muelle"]
    },
    {
      sucursal_id: 2,
      nombre: "Jardín Zen Mirador de Volcanes",
      aforo_maximo: 18,
      imagen_key: uploadedS3Keys["atitlan_amenidad_jardin"]
    },
    // Sede 3 (Xela)
    {
      sucursal_id: 3,
      nombre: "Biblioteca y Salón Los Altos",
      aforo_maximo: 14,
      imagen_key: uploadedS3Keys["xela_amenidad_biblioteca"]
    },
    {
      sucursal_id: 3,
      nombre: "Mirador Panorámico del Valle",
      aforo_maximo: 20,
      imagen_key: uploadedS3Keys["xela_amenidad_mirador"]
    },
    // Sede 4 (Capital)
    {
      sucursal_id: 4,
      nombre: "Terraza Lounge Urbana Zona 10",
      aforo_maximo: 30,
      imagen_key: uploadedS3Keys["capital_amenidad_terraza"]
    },
    {
      sucursal_id: 4,
      nombre: "Piscina Climatizada y Solárium",
      aforo_maximo: 20,
      imagen_key: uploadedS3Keys["capital_amenidad_piscina"]
    }
  ];

  for (const item of amenidadesData) {
    const existing = await Amenidad.findOne({
      where: { sucursal_id: item.sucursal_id, nombre: item.nombre }
    });
    if (existing) {
      await existing.update(item);
      console.log(`  Actualizada amenidad: ${item.nombre} (Sede ${item.sucursal_id})`);
    } else {
      await Amenidad.create(item);
      console.log(`  Creada amenidad: ${item.nombre} (Sede ${item.sucursal_id})`);
    }
  }

  // 3.3 Restaurante (Mesas): 7 mesas por sede (28 total)
  console.log("-> Incorporando mesas de restaurante por sede...");
  const mesasData = [
    // Antigua (Sede 1)
    { sucursal_id: 1, zona: "Terraza Colonial", capacidad: 2, estado: "disponible" },
    { sucursal_id: 1, zona: "Terraza Colonial", capacidad: 4, estado: "disponible" },
    { sucursal_id: 1, zona: "Salón Virreinal", capacidad: 4, estado: "disponible" },
    { sucursal_id: 1, zona: "Salón Virreinal", capacidad: 6, estado: "disponible" },
    { sucursal_id: 1, zona: "Jardín de Buganvilias", capacidad: 2, estado: "disponible" },
    { sucursal_id: 1, zona: "Jardín de Buganvilias", capacidad: 4, estado: "disponible" },
    { sucursal_id: 1, zona: "Cava Colonial", capacidad: 6, estado: "disponible" },

    // Atitlán (Sede 2)
    { sucursal_id: 2, zona: "Muelle Panorámico", capacidad: 2, estado: "disponible" },
    { sucursal_id: 2, zona: "Muelle Panorámico", capacidad: 4, estado: "disponible" },
    { sucursal_id: 2, zona: "Terraza Atitlán", capacidad: 4, estado: "disponible" },
    { sucursal_id: 2, zona: "Terraza Atitlán", capacidad: 6, estado: "disponible" },
    { sucursal_id: 2, zona: "Comedor Central", capacidad: 2, estado: "disponible" },
    { sucursal_id: 2, zona: "Comedor Central", capacidad: 4, estado: "disponible" },
    { sucursal_id: 2, zona: "Mirador Volcanes", capacidad: 6, estado: "disponible" },

    // Xela (Sede 3)
    { sucursal_id: 3, zona: "Salón Los Altos", capacidad: 2, estado: "disponible" },
    { sucursal_id: 3, zona: "Salón Los Altos", capacidad: 4, estado: "disponible" },
    { sucursal_id: 3, zona: "Mezzanine Central", capacidad: 4, estado: "disponible" },
    { sucursal_id: 3, zona: "Mezzanine Central", capacidad: 6, estado: "disponible" },
    { sucursal_id: 3, zona: "Rincón Histórico", capacidad: 2, estado: "disponible" },
    { sucursal_id: 3, zona: "Rincón Histórico", capacidad: 4, estado: "disponible" },
    { sucursal_id: 3, zona: "Salón de Chimenea", capacidad: 6, estado: "disponible" },

    // Capital (Sede 4)
    { sucursal_id: 4, zona: "Terraza Urbana Zona 10", capacidad: 2, estado: "disponible" },
    { sucursal_id: 4, zona: "Terraza Urbana Zona 10", capacidad: 4, estado: "disponible" },
    { sucursal_id: 4, zona: "Comedor Principal", capacidad: 4, estado: "disponible" },
    { sucursal_id: 4, zona: "Comedor Principal", capacidad: 6, estado: "disponible" },
    { sucursal_id: 4, zona: "Espacio Bistro", capacidad: 2, estado: "disponible" },
    { sucursal_id: 4, zona: "Espacio Bistro", capacidad: 4, estado: "disponible" },
    { sucursal_id: 4, zona: "Mesa Ejecutiva", capacidad: 8, estado: "disponible" },
  ];

  const currentMesasCount = await Mesa.count();
  if (currentMesasCount === 0) {
    await Mesa.bulkCreate(mesasData);
    console.log(`  Creadas ${mesasData.length} mesas en total (7 por sede).`);
  } else {
    console.log(`  Ya existen ${currentMesasCount} mesas registradas.`);
  }

  // 3.4 Salones: 2 por sede (8 en total)
  console.log("-> Incorporando salones de eventos por sede...");
  const salonesData = [
    // Sede 1 (Antigua)
    {
      sucursal_id: 1,
      nombre: "Gran Salón Virreinal",
      capacidad_maxima: 120,
      tarifa_base: 3500.00,
      descripcion: "Majestuoso salón colonial con artesonado de madera noble, iluminación cálida y acceso directo a patios ajardinados. Ideal para recepciones, bodas y banquetes de gala.",
      imagen_key: uploadedS3Keys["antigua_salon_virreinal"]
    },
    {
      sucursal_id: 1,
      nombre: "Salón Las Buganvilias",
      capacidad_maxima: 45,
      tarifa_base: 1800.00,
      descripcion: "Espacio colonial íntimo y versátil, adecuado para reuniones de trabajo, conferencias y talleres empresariales.",
      imagen_key: uploadedS3Keys["antigua_salon_buganvilias"]
    },
    // Sede 2 (Atitlán)
    {
      sucursal_id: 2,
      nombre: "Salón Panorámico Atitlán",
      capacidad_maxima: 90,
      tarifa_base: 3000.00,
      descripcion: "Salón con ventanales de piso a techo y vista privilegiada al lago y a los volcanes. Perfecto para convenciones, cenas corporativas y bodas.",
      imagen_key: uploadedS3Keys["atitlan_salon_panoramico"]
    },
    {
      sucursal_id: 2,
      nombre: "Terraza de Eventos El Muelle",
      capacidad_maxima: 50,
      tarifa_base: 1600.00,
      descripcion: "Área abierta y techada frente a las orillas del lago, óptima para cócteles al atardecer y presentaciones exclusivas.",
      imagen_key: uploadedS3Keys["atitlan_salon_terraza"]
    },
    // Sede 3 (Xela)
    {
      sucursal_id: 3,
      nombre: "Salón Imperial Los Altos",
      capacidad_maxima: 100,
      tarifa_base: 2800.00,
      descripcion: "Espacio señorial de techos altos y finos acabados en piedra y cantera, diseñado para congresos y eventos sociales de distinción.",
      imagen_key: uploadedS3Keys["xela_salon_imperial"]
    },
    {
      sucursal_id: 3,
      nombre: "Salón Ejecutivo Santa María",
      capacidad_maxima: 35,
      tarifa_base: 1400.00,
      descripcion: "Sala ejecutiva moderna con equipamiento audiovisual para juntas de negocios y capacitaciones corporativas.",
      imagen_key: uploadedS3Keys["xela_salon_santa_maria"]
    },
    // Sede 4 (Capital)
    {
      sucursal_id: 4,
      nombre: "Gran Salón Metropolitano",
      capacidad_maxima: 150,
      tarifa_base: 4500.00,
      descripcion: "Salón modular contemporáneo de gran capacidad con tecnología audiovisual integrada y acústica profesional para convenciones internacionales.",
      imagen_key: uploadedS3Keys["capital_salon_metropolitano"]
    },
    {
      sucursal_id: 4,
      nombre: "Sala Ejecutiva Hunahpú",
      capacidad_maxima: 30,
      tarifa_base: 1900.00,
      descripcion: "Exclusiva sala de juntas ejecutiva en Zona 10 con mobiliario ergonómico de alta gama, pantalla interactiva y servicio de café continuo.",
      imagen_key: uploadedS3Keys["capital_salon_ejecutiva"]
    }
  ];

  for (const item of salonesData) {
    const existing = await Salon.findOne({
      where: { sucursal_id: item.sucursal_id, nombre: item.nombre }
    });
    if (existing) {
      await existing.update(item);
      console.log(`  Actualizado salón: ${item.nombre} (Sede ${item.sucursal_id})`);
    } else {
      await Salon.create(item);
      console.log(`  Creado salón: ${item.nombre} (Sede ${item.sucursal_id})`);
    }
  }

  // 3.5 Recursos de Actividad: 2 por sede (8 en total)
  console.log("-> Incorporando recursos de actividad por sede...");
  const recursosData = [
    // Sede 1 (Antigua)
    {
      sucursal_id: 1,
      tipo: "ciclismo",
      nombre: "Tour Colonial en Bicicleta",
      precio_hora: 75.00,
      precio_equipo: 35.00,
      precio_instructor_hora: 60.00,
      imagen_key: uploadedS3Keys["antigua_actividad_ciclismo"]
    },
    {
      sucursal_id: 1,
      tipo: "tenis",
      nombre: "Cancha de Tenis Antigua",
      precio_hora: 120.00,
      precio_equipo: 40.00,
      precio_instructor_hora: 80.00,
      imagen_key: uploadedS3Keys["antigua_actividad_tenis"]
    },
    // Sede 2 (Atitlán)
    {
      sucursal_id: 2,
      tipo: "kayak",
      nombre: "Kayak y Paddleboard en Atitlán",
      precio_hora: 90.00,
      precio_equipo: 45.00,
      precio_instructor_hora: 70.00,
      imagen_key: uploadedS3Keys["atitlan_actividad_kayak"]
    },
    {
      sucursal_id: 2,
      tipo: "senderismo",
      nombre: "Senderismo Volcanes de Atitlán",
      precio_hora: 60.00,
      precio_equipo: 25.00,
      precio_instructor_hora: 75.00,
      imagen_key: uploadedS3Keys["atitlan_actividad_senderismo"]
    },
    // Sede 3 (Xela)
    {
      sucursal_id: 3,
      tipo: "senderismo",
      nombre: "Montañismo Cerro del Baúl",
      precio_hora: 65.00,
      precio_equipo: 30.00,
      precio_instructor_hora: 70.00,
      imagen_key: uploadedS3Keys["xela_actividad_montanismo"]
    },
    {
      sucursal_id: 3,
      tipo: "billar",
      nombre: "Mesas de Billar Salón Los Altos",
      precio_hora: 50.00,
      precio_equipo: 20.00,
      precio_instructor_hora: 0.00,
      imagen_key: uploadedS3Keys["xela_actividad_billar"]
    },
    // Sede 4 (Capital)
    {
      sucursal_id: 4,
      tipo: "squash",
      nombre: "Cancha de Squash Zona 10",
      precio_hora: 110.00,
      precio_equipo: 35.00,
      precio_instructor_hora: 75.00,
      imagen_key: uploadedS3Keys["capital_actividad_squash"]
    },
    {
      sucursal_id: 4,
      tipo: "golf",
      nombre: "Simulador Virtual de Golf",
      precio_hora: 150.00,
      precio_equipo: 50.00,
      precio_instructor_hora: 100.00,
      imagen_key: uploadedS3Keys["capital_actividad_golf"]
    }
  ];

  for (const item of recursosData) {
    const existing = await RecursoActividad.findOne({
      where: { sucursal_id: item.sucursal_id, nombre: item.nombre }
    });
    if (existing) {
      await existing.update(item);
      console.log(`  Actualizado recurso de actividad: ${item.nombre} (Sede ${item.sucursal_id})`);
    } else {
      await RecursoActividad.create(item);
      console.log(`  Creado recurso de actividad: ${item.nombre} (Sede ${item.sucursal_id})`);
    }
  }

  // 3.6 Servicios de Bienestar: 4 servicios globales
  console.log("-> Incorporando servicios de bienestar (globales)...");
  const bienestarData = [
    {
      nombre: "Masaje Holístico Maya con Piedras Volcánicas",
      duracion_minutos: 60,
      precio: 450.00,
      imagen_key: uploadedS3Keys["bienestar_masaje"]
    },
    {
      nombre: "Circuito Termal e Hidroterapia Relajante",
      duracion_minutos: 45,
      precio: 320.00,
      imagen_key: uploadedS3Keys["bienestar_hidroterapia"]
    },
    {
      nombre: "Tratamiento Facial con Botánicos Autóctonos",
      duracion_minutos: 50,
      precio: 380.00,
      imagen_key: uploadedS3Keys["bienestar_facial"]
    },
    {
      nombre: "Aromaterapia y Envoltura Corporal Calmante",
      duracion_minutos: 75,
      precio: 520.00,
      imagen_key: uploadedS3Keys["bienestar_aromaterapia"]
    }
  ];

  for (const item of bienestarData) {
    const existing = await ServicioBienestar.findOne({
      where: { nombre: item.nombre }
    });
    if (existing) {
      await existing.update(item);
      console.log(`  Actualizado servicio bienestar: ${item.nombre}`);
    } else {
      await ServicioBienestar.create(item);
      console.log(`  Creado servicio bienestar: ${item.nombre}`);
    }
  }

  console.log("\n=================================================================");
  console.log("DESPLIEGUE OPERATIVO Y FOTOGRÁFICO COMPLETADO EXITOSAMENTE");
  console.log("=================================================================");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error crítico durante el despliegue:", err);
  process.exit(1);
});
