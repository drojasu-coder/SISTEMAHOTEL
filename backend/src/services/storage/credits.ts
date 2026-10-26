/**
 * Catálogo centralizado de créditos fotográficos dinámicos asociados a activos fotográficos oficiales verificados.
 * Si un archivo o clave es reemplazado o eliminado, los créditos se disocian automáticamente.
 */
export interface AssetCreditInfo {
  autor: string;
  licencia: string;
  url: string;
  texto: string;
}

export const KNOWN_ASSET_CREDITS: Record<string, AssetCreditInfo> = {
  // --- PORTADAS OFICIALES (4 Sedes) ---
  "sedes/hotel-hunahpu-antigua/portada/portada-1792976550336-c6e0ea0e64f3.webp": {
    autor: "Chad Davis",
    licencia: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Santa_Catalina_Arch.jpg",
    texto: "Chad Davis (CC BY 2.0)",
  },
  "sedes/hotel-hunahpu-atitlan/portada/portada-1792961997929-90ce1baa6953.webp": {
    autor: "Chad Davis",
    licencia: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Lake_Atitl%C3%A1n_%26_Panajachel_Guatemala.jpg",
    texto: "Chad Davis (CC BY 2.0)",
  },
  "sedes/2/portada_1792961997929_90ce1baa6953.webp": {
    autor: "Chad Davis",
    licencia: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Lake_Atitl%C3%A1n_%26_Panajachel_Guatemala.jpg",
    texto: "Chad Davis (CC BY 2.0)",
  },
  "sedes/hotel-hunahpu-xela/portada/portada-1792976553574-024b2ef909c7.webp": {
    autor: "Simon Burchell",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Pasaje_Enr%C3%ADquez%2C_Quetzaltenango%2C_2022.jpg",
    texto: "Simon Burchell (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/portada/portada-1792976556088-50343740bac6.webp": {
    autor: "Rene Hernandez",
    licencia: "CC BY-SA 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Zona_10_-_Ciudad_de_Guatemala_-_CDGT.jpg",
    texto: "Rene Hernandez (CC BY-SA 2.0)",
  },

  // --- ATITLÁN (Habitaciones, Restaurante y Amenidad) ---
  "sedes/hotel-hunahpu-atitlan/habitaciones/individual-1792979378527-420f162f2ab7.webp": {
    autor: "J o",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Kobe_Portopia_Hotel_Oval_Club_single_bedroom_20130621-002.jpg",
    texto: "J o (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/habitaciones/doble-1792979379614-1f76606e8cc7.webp": {
    autor: "Atwngirl",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:2022_-_Americus_Hotel_-_Double_Room_-_Allentown_PA.jpg",
    texto: "Atwngirl (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/habitaciones/suite-1792979380176-40a2118460a9.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Lobby_lounge_of_Amantaka_Suite_Amantaka_luxury_Resort_%26_Hotel_Luang_Prabang_Laos.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/restaurante/restaurante-1792979380626-ed36344b711b.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Restaurant_room_of_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/amenidades/piscina-terraza-1792979381008-038e78a52f05.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Swimming_pool_and_terrasse_of_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },

  // --- ANTIGUA (Habitaciones, Restaurante y Amenidad) ---
  "sedes/hotel-hunahpu-antigua/habitaciones/individual-1792979381507-3a2dc3c5b8fc.webp": {
    autor: "jjmusgrove",
    licencia: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Antigua_Guatemala_-_Fine_Hotel_Bedroom.jpg",
    texto: "jjmusgrove (CC BY 2.0)",
  },
  "sedes/hotel-hunahpu-antigua/habitaciones/doble-1792979381786-9cd99362721f.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Canopy_bed_of_Amantaka_Suite_in_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-antigua/habitaciones/suite-1792979382090-513f3df1acd7.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Canopy_bed_and_wardrobes_in_Khan_Pool_Suite_at_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-antigua/restaurante/restaurante-1792979382402-8965e135bf0c.webp": {
    autor: "Mario Pleitez",
    licencia: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Hotel_Casa_Santo_Domingo.jpg",
    texto: "Mario Pleitez (CC BY 2.0)",
  },
  "sedes/hotel-hunahpu-antigua/amenidades/area-descanso-1792979382890-7c927720f18a.webp": {
    autor: "Adam Jones",
    licencia: "CC BY-SA 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Garden_View_-_Hotel_Casa_de_Santo_Domingo_-_Antigua_Guatemala_-_Sacatepequez_-_Guatemala_(15919423265).jpg",
    texto: "Adam Jones (CC BY-SA 2.0)",
  },

  // --- XELA (Habitaciones, Restaurante y Amenidad) ---
  "sedes/hotel-hunahpu-xela/habitaciones/individual-1792979383570-c0c20efce3e7.webp": {
    autor: "Thomas Ledl",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Hotel_Kasererbr%C3%A4u,_Salzburg_-_Zimmer_323_(05).jpg",
    texto: "Thomas Ledl (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/habitaciones/doble-1792979383865-a403d4595839.webp": {
    autor: "Thomas Ledl",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Hotel_Kasererbr%C3%A4u,_Salzburg_-_Zimmer_323_(03).jpg",
    texto: "Thomas Ledl (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/habitaciones/suite-1792979384157-60ca7a5535f4.webp": {
    autor: "Thomas Ledl",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Hotel_Kasererbr%C3%A4u,_Salzburg_-_Zimmer_323_(14).jpg",
    texto: "Thomas Ledl (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/restaurante/restaurante-1792979384445-ec4e9ccb7221.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Row_of_round_tables_and_doors_in_restaurant_of_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/amenidades/gimnasio-sauna-1792979384813-e01a1568baf4.webp": {
    autor: "William Murphy",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:The_Dean_Hotel,_Cork,_Sept_2025_03.jpg",
    texto: "William Murphy (CC BY-SA 4.0)",
  },

  // --- CAPITAL (Habitaciones, Restaurante y Amenidad) ---
  "sedes/hotel-hunahpu-capital/habitaciones/individual-1792979385123-9363904f8dd0.webp": {
    autor: "Sarah Stierch",
    licencia: "CC0 1.0",
    url: "https://commons.wikimedia.org/wiki/File:Aloft_San_Francisco_Airport_-_July_2025_-_Sarah_Stierch_03.jpg",
    texto: "Sarah Stierch (CC0 1.0)",
  },
  "sedes/hotel-hunahpu-capital/habitaciones/doble-1792979385446-cd158329ef17.webp": {
    autor: "HIex.osaka",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:2_Single_Beds_Standard_City_View.jpg",
    texto: "HIex.osaka (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/habitaciones/suite-1792979385758-59871b8cbe76.webp": {
    autor: "TravelingOtter",
    licencia: "CC BY-SA 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Executive_Suite_Living_Room_-_Four_Points_L%C3%A9vis_(3242121913).jpg",
    texto: "TravelingOtter (CC BY-SA 2.0)",
  },
  "sedes/hotel-hunahpu-capital/restaurante/restaurante-1792979386020-7a136c58e912.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:The_Clifford_Pier_restaurant_at_The_Fullerton_Bay_Hotel_Singapore.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/amenidades/salon-ejecutivo-1792979386396-151d6e1b7244.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Interior_of_Executive_Lounge_of_the_Grand_Hi-Lai_Hotel,_Kaohsiung-06.2024-11-11.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
};

/**
 * Obtiene el crédito fotográfico dinámico correspondiente a una clave de almacenamiento,
 * o null si no existe o la clave es nula.
 */
export function getAssetCredits(key: string | null | undefined): AssetCreditInfo | null {
  if (!key) return null;
  return KNOWN_ASSET_CREDITS[key] || null;
}
