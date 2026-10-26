import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { putStorageObject, getStorageObject } from "../src/services/storage/s3.service";
const db = require("../src/models");
const { Sucursal, Amenidad, TipoHabitacion, Habitacion, sequelize } = db;

const baseMaterialDir = "/home/diegorojas/Workspace/Universidad/DESARROLLOWEB/MATERIAL-HOTEL/SEDES";

interface AssetToUpload {
  sedeSlug: string;
  category: "habitaciones" | "restaurante" | "amenidades";
  subSlug: string;
  localFolder: string;
  localFile: string;
  authorCredit: string;
  targetEntity: "sucursal_restaurante" | "amenidad" | "tipo_habitacion" | "habitacion";
  entityId: number;
}

const assets: AssetToUpload[] = [
  // --- ATITLÁN (Sede 2) ---
  {
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "habitaciones",
    subSlug: "individual",
    localFolder: "SEDE-HOTEL-HUNAHPU-ATITLAN",
    localFile: "02_habitacion_individual_atitlan.webp",
    authorCredit: "J o (CC BY-SA 4.0)",
    targetEntity: "tipo_habitacion",
    entityId: 1, // default Individual
  },
  {
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "habitaciones",
    subSlug: "doble",
    localFolder: "SEDE-HOTEL-HUNAHPU-ATITLAN",
    localFile: "03_habitacion_doble_atitlan.webp",
    authorCredit: "Atwngirl (CC BY-SA 4.0)",
    targetEntity: "tipo_habitacion",
    entityId: 2, // default Doble
  },
  {
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "habitaciones",
    subSlug: "suite",
    localFolder: "SEDE-HOTEL-HUNAHPU-ATITLAN",
    localFile: "04_habitacion_suite_atitlan.webp",
    authorCredit: "Basile Morin (CC BY-SA 4.0)",
    targetEntity: "tipo_habitacion",
    entityId: 3, // default Suite
  },
  {
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "restaurante",
    subSlug: "restaurante",
    localFolder: "SEDE-HOTEL-HUNAHPU-ATITLAN",
    localFile: "05_restaurante_atitlan.webp",
    authorCredit: "Basile Morin (CC BY-SA 4.0)",
    targetEntity: "sucursal_restaurante",
    entityId: 2,
  },
  {
    sedeSlug: "hotel-hunahpu-atitlan",
    category: "amenidades",
    subSlug: "piscina-terraza",
    localFolder: "SEDE-HOTEL-HUNAHPU-ATITLAN",
    localFile: "06_amenidad_piscina_terraza_atitlan.webp",
    authorCredit: "Basile Morin (CC BY-SA 4.0)",
    targetEntity: "amenidad",
    entityId: 2, // Amenidad ID 2 (Piscina y terraza)
  },

  // --- ANTIGUA (Sede 1) ---
  {
    sedeSlug: "hotel-hunahpu-antigua",
    category: "habitaciones",
    subSlug: "individual",
    localFolder: "SEDE-HOTEL-HUNAHPU-ANTIGUA",
    localFile: "02_habitacion_individual_antigua.webp",
    authorCredit: "jjmusgrove (CC BY 2.0)",
    targetEntity: "habitacion",
    entityId: 1, // Habitación 101 (Antigua Individual)
  },
  {
    sedeSlug: "hotel-hunahpu-antigua",
    category: "habitaciones",
    subSlug: "doble",
    localFolder: "SEDE-HOTEL-HUNAHPU-ANTIGUA",
    localFile: "03_habitacion_doble_antigua.webp",
    authorCredit: "Basile Morin (CC BY-SA 4.0)",
    targetEntity: "habitacion",
    entityId: 2, // Habitación 102 (Antigua Doble)
  },
  {
    sedeSlug: "hotel-hunahpu-antigua",
    category: "habitaciones",
    subSlug: "suite",
    localFolder: "SEDE-HOTEL-HUNAHPU-ANTIGUA",
    localFile: "04_habitacion_suite_antigua.webp",
    authorCredit: "Basile Morin (CC BY-SA 4.0)",
    targetEntity: "habitacion",
    entityId: 3, // Habitación 103 (Antigua Suite)
  },
  {
    sedeSlug: "hotel-hunahpu-antigua",
    category: "restaurante",
    subSlug: "restaurante",
    localFolder: "SEDE-HOTEL-HUNAHPU-ANTIGUA",
    localFile: "05_restaurante_antigua.webp",
    authorCredit: "Mario Pleitez (CC BY 2.0)",
    targetEntity: "sucursal_restaurante",
    entityId: 1,
  },
  {
    sedeSlug: "hotel-hunahpu-antigua",
    category: "amenidades",
    subSlug: "area-descanso",
    localFolder: "SEDE-HOTEL-HUNAHPU-ANTIGUA",
    localFile: "06_amenidad_area_descanso_antigua.webp",
    authorCredit: "Adam Jones (CC BY-SA 2.0)",
    targetEntity: "amenidad",
    entityId: 1, // Amenidad ID 1 (Área de descanso)
  },

  // --- XELA (Sede 3) ---
  {
    sedeSlug: "hotel-hunahpu-xela",
    category: "habitaciones",
    subSlug: "individual",
    localFolder: "SEDE-HOTEL-HUNAHPU-XELA",
    localFile: "02_habitacion_individual_xela.webp",
    authorCredit: "Thomas Ledl (CC BY-SA 4.0)",
    targetEntity: "habitacion",
    entityId: 0,
  },
  {
    sedeSlug: "hotel-hunahpu-xela",
    category: "habitaciones",
    subSlug: "doble",
    localFolder: "SEDE-HOTEL-HUNAHPU-XELA",
    localFile: "03_habitacion_doble_xela.webp",
    authorCredit: "Thomas Ledl (CC BY-SA 4.0)",
    targetEntity: "habitacion",
    entityId: 0,
  },
  {
    sedeSlug: "hotel-hunahpu-xela",
    category: "habitaciones",
    subSlug: "suite",
    localFolder: "SEDE-HOTEL-HUNAHPU-XELA",
    localFile: "04_habitacion_suite_xela.webp",
    authorCredit: "Thomas Ledl (CC BY-SA 4.0)",
    targetEntity: "habitacion",
    entityId: 0,
  },
  {
    sedeSlug: "hotel-hunahpu-xela",
    category: "restaurante",
    subSlug: "restaurante",
    localFolder: "SEDE-HOTEL-HUNAHPU-XELA",
    localFile: "05_restaurante_xela.webp",
    authorCredit: "Basile Morin (CC BY-SA 4.0)",
    targetEntity: "sucursal_restaurante",
    entityId: 3,
  },
  {
    sedeSlug: "hotel-hunahpu-xela",
    category: "amenidades",
    subSlug: "gimnasio-sauna",
    localFolder: "SEDE-HOTEL-HUNAHPU-XELA",
    localFile: "06_amenidad_gimnasio_sauna_xela.webp",
    authorCredit: "William Murphy (CC BY-SA 4.0)",
    targetEntity: "amenidad",
    entityId: 3, // Amenidad ID 3 (Gimnasio y sauna)
  },

  // --- CAPITAL (Sede 4) ---
  {
    sedeSlug: "hotel-hunahpu-capital",
    category: "habitaciones",
    subSlug: "individual",
    localFolder: "SEDE-HOTEL-HUNAHPU-CAPITAL",
    localFile: "02_habitacion_individual_capital.webp",
    authorCredit: "Sarah Stierch (CC0 1.0)",
    targetEntity: "habitacion",
    entityId: 0,
  },
  {
    sedeSlug: "hotel-hunahpu-capital",
    category: "habitaciones",
    subSlug: "doble",
    localFolder: "SEDE-HOTEL-HUNAHPU-CAPITAL",
    localFile: "03_habitacion_doble_capital.webp",
    authorCredit: "HIex.osaka (CC BY-SA 4.0)",
    targetEntity: "habitacion",
    entityId: 0,
  },
  {
    sedeSlug: "hotel-hunahpu-capital",
    category: "habitaciones",
    subSlug: "suite",
    localFolder: "SEDE-HOTEL-HUNAHPU-CAPITAL",
    localFile: "04_habitacion_suite_capital.webp",
    authorCredit: "TravelingOtter (CC BY-SA 2.0)",
    targetEntity: "habitacion",
    entityId: 0,
  },
  {
    sedeSlug: "hotel-hunahpu-capital",
    category: "restaurante",
    subSlug: "restaurante",
    localFolder: "SEDE-HOTEL-HUNAHPU-CAPITAL",
    localFile: "05_restaurante_capital.webp",
    authorCredit: "Basile Morin (CC BY-SA 4.0)",
    targetEntity: "sucursal_restaurante",
    entityId: 4,
  },
  {
    sedeSlug: "hotel-hunahpu-capital",
    category: "amenidades",
    subSlug: "salon-ejecutivo",
    localFolder: "SEDE-HOTEL-HUNAHPU-CAPITAL",
    localFile: "06_amenidad_salon_ejecutivo_capital.webp",
    authorCredit: "Tai-Hsiang Chou (CC BY-SA 4.0)",
    targetEntity: "amenidad",
    entityId: 4, // Amenidad ID 4 (Salón ejecutivo)
  },
];

async function run() {
  console.log(`Starting S3 upload of ${assets.length} hotel media assets...`);
  const uploadedResults: Record<string, { s3Key: string; credit: string }> = {};

  for (let i = 0; i < assets.length; i++) {
    const item = assets[i];
    const filePath = path.join(baseMaterialDir, item.localFolder, "optimizadas", item.localFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found: ${filePath}`);
    }
    const buffer = fs.readFileSync(filePath);
    const hash = crypto.randomBytes(6).toString("hex");
    const s3Key = `sedes/${item.sedeSlug}/${item.category}/${item.subSlug}-${Date.now()}-${hash}.webp`;

    console.log(`[${i + 1}/${assets.length}] Uploading ${s3Key} (${buffer.length} bytes)...`);
    await putStorageObject(s3Key, buffer, "image/webp");

    // Verify S3 read
    const verifyBuffer = await getStorageObject(s3Key);
    if (verifyBuffer.length !== buffer.length) {
      throw new Error(`Verification failed for ${s3Key}: expected ${buffer.length} bytes, got ${verifyBuffer.length}`);
    }

    uploadedResults[`${item.sedeSlug}_${item.localFile}`] = {
      s3Key,
      credit: item.authorCredit,
    };

    // Update DB
    if (item.targetEntity === "sucursal_restaurante") {
      await Sucursal.update(
        { restaurante_imagen_key: s3Key },
        { where: { id: item.entityId } }
      );
      console.log(`  -> Linked sucursal ${item.entityId} restaurante_imagen_key = ${s3Key}`);
    } else if (item.targetEntity === "amenidad") {
      await Amenidad.update(
        { imagen_key: s3Key },
        { where: { id: item.entityId } }
      );
      console.log(`  -> Linked amenidad ${item.entityId} imagen_key = ${s3Key}`);
    } else if (item.targetEntity === "tipo_habitacion") {
      await TipoHabitacion.update(
        { imagen_key: s3Key },
        { where: { id: item.entityId } }
      );
      console.log(`  -> Linked tipo_habitacion ${item.entityId} imagen_key = ${s3Key}`);
    } else if (item.targetEntity === "habitacion" && item.entityId > 0) {
      await Habitacion.update(
        { imagen_key: s3Key },
        { where: { id: item.entityId } }
      );
      console.log(`  -> Linked habitacion ${item.entityId} imagen_key = ${s3Key}`);
    }
  }

  console.log("\n--- COMPLETE UPLOAD & CREDIT MAP ---");
  console.log(JSON.stringify(uploadedResults, null, 2));

  // Save map to scratch for later use
  const outPath = "/home/diegorojas/.gemini/antigravity-acp/brain/44054136-5268-4f77-b02e-fb254c95b19f/scratch/uploaded_assets_map.json";
  fs.writeFileSync(outPath, JSON.stringify(uploadedResults, null, 2));
  console.log(`Saved mapping to ${outPath}`);

  await sequelize.close();
}

run().catch((err) => {
  console.error("Upload error:", err);
  process.exit(1);
});
