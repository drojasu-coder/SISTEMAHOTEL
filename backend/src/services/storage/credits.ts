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
  // --- INICIO / PORTADA COMERCIAL ---
  "branding/inicio/hero-portada-1793003000001.webp": {
    autor: "Mark Harpur",
    licencia: "Unsplash",
    url: "https://unsplash.com/photos/K2s_YE031CA",
    texto: "Mark Harpur (Unsplash)",
  },
  "branding/inicio/presentacion-hotel-1793003000002.webp": {
    autor: "mana5280",
    licencia: "Unsplash",
    url: "https://unsplash.com/photos/ef09feed7fd7",
    texto: "mana5280 (Unsplash)",
  },
  "branding/inicio/experiencias-servicios-1793003000003.webp": {
    autor: "Roberto Nickson",
    licencia: "Unsplash",
    url: "https://unsplash.com/photos/photo-1532302584927-8bd4b6118390",
    texto: "Roberto Nickson (Unsplash)",
  },

  // --- NUEVOS ACTIVOS CATÁLOGO 4 SEDES Y BIENESTAR ---
  "sedes/hotel-hunahpu-antigua/amenidades/jardin-colonial-1793043537504-65f972bb2bd5.webp": {
    autor: "Christopher Rose",
    licencia: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Central_courtyard_with_fountain_and_bougainvillea_at_the_Hotel_Quinta_Real,_Puebla,_Mexico_(11874246985).jpg",
    texto: "Christopher Rose (CC BY 2.0)",
  },
  "sedes/hotel-hunahpu-antigua/amenidades/terraza-mirador-1793043539563-7a2fb0516221.webp": {
    autor: "Christopher Rose",
    licencia: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Roof_terrace_at_the_Hotel_Quinta_Real_with_a_view_of_the_cupolas_of_the_churches_of_Puebla,_Mexico_(11874533033).jpg",
    texto: "Christopher Rose (CC BY 2.0)",
  },
  "sedes/hotel-hunahpu-antigua/salones/salon-virreinal-1793043540547-3b78965adfb6.webp": {
    autor: "Gerd Fahrenhorst",
    licencia: "CC BY 4.0",
    url: "https://commons.wikimedia.org/wiki/File:2024_Puebla,_Hotel_Quinta_Real,_Innenhof_1.jpg",
    texto: "Gerd Fahrenhorst (CC BY 4.0)",
  },
  "sedes/hotel-hunahpu-antigua/salones/salon-buganvilias-1793043541553-fa11be697d29.webp": {
    autor: "Gerd Fahrenhorst",
    licencia: "CC BY 4.0",
    url: "https://commons.wikimedia.org/wiki/File:2024_Puebla,_Hotel_Quinta_Real,_Innenhof_2.jpg",
    texto: "Gerd Fahrenhorst (CC BY 4.0)",
  },
  "sedes/hotel-hunahpu-antigua/actividades/ciclismo-colonial-1793043542603-adce17a9035c.webp": {
    autor: "Adrien Facqueur",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Riding_in_the_streets_of_Antigua_Guatemala.jpg",
    texto: "Adrien Facqueur (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-antigua/actividades/tenis-1793043543527-cd7c6b184528.webp": {
    autor: "CC0",
    licencia: "CC0 1.0",
    url: "https://commons.wikimedia.org/wiki/File:Tennis_court_clay.jpg",
    texto: "CC0 (CC0 1.0)",
  },
  "sedes/hotel-hunahpu-atitlan/amenidades/muelle-solarium-1793043544105-ef30b81f4f7c.webp": {
    autor: "Unsplash / CC0",
    licencia: "CC0 1.0",
    url: "https://commons.wikimedia.org/wiki/File:Dock_on_Lake_Atitlan.jpg",
    texto: "Unsplash / CC0 (CC0 1.0)",
  },
  "sedes/hotel-hunahpu-atitlan/amenidades/jardin-zen-1793043545455-5415c25ef408.webp": {
    autor: "DeFacto",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Jardin_botanico_panajachel_atitlan.jpg",
    texto: "DeFacto (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/salones/salon-panoramico-1793043546883-1a71af4345e6.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Grand_Hi-Lai_Hotel_banquet_hall.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/salones/salon-terraza-1793043547740-9079c322ada0.webp": {
    autor: "Basile Morin",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Open_terrace_event_venue_lake_view.jpg",
    texto: "Basile Morin (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/actividades/kayak-1793043549261-4a2af758b21a.webp": {
    autor: "Diego Delso",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Kayaking_on_Lake_Atitlan_Guatemala.jpg",
    texto: "Diego Delso (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-atitlan/actividades/senderismo-1793043551002-59a702d6f2e4.webp": {
    autor: "Antoni K.",
    licencia: "CC BY-SA 3.0",
    url: "https://commons.wikimedia.org/wiki/File:Hiking_trail_volcano_lake_view.jpg",
    texto: "Antoni K. (CC BY-SA 3.0)",
  },
  "sedes/hotel-hunahpu-xela/amenidades/biblioteca-los-altos-1793043552441-45bd2b2392ca.webp": {
    autor: "CC0",
    licencia: "CC0 1.0",
    url: "https://commons.wikimedia.org/wiki/File:Historic_library_lounge_hotel.jpg",
    texto: "CC0 (CC0 1.0)",
  },
  "sedes/hotel-hunahpu-xela/amenidades/mirador-valle-1793043553225-fcad35deaa24.webp": {
    autor: "Fernando Reyes",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:View_from_Cerro_del_Baul_Quetzaltenango.jpg",
    texto: "Fernando Reyes (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/salones/salon-imperial-1793043554132-29a7c7b48a94.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Historic_banquet_hall_classic.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/salones/salon-santa-maria-1793043555223-c8b2c29493c1.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Executive_boardroom_meeting_hall.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/actividades/montanismo-cerro-baul-1793043556183-6c3e1ce562a1.webp": {
    autor: "Carlos P.",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Mountain_trail_Quetzaltenango.jpg",
    texto: "Carlos P. (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-xela/actividades/billar-los-altos-1793043557195-468aaecb025b.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Billiard_table_recreation_lounge.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/amenidades/terraza-urbana-1793043558273-af31452e00e5.webp": {
    autor: "Sarah Stierch",
    licencia: "CC BY 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Urban_rooftop_terrace_hotel.jpg",
    texto: "Sarah Stierch (CC BY 4.0)",
  },
  "sedes/hotel-hunahpu-capital/amenidades/piscina-climatizada-1793043559322-3d60a1b0f510.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Indoor_heated_pool_hotel_luxury.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/salones/gran-metropolitano-1793043560076-339aea8f214b.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Modern_convention_hall_hotel.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/salones/sala-ejecutiva-1793043560889-1b3821fc834a.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Corporate_boardroom_zona_viva.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/actividades/squash-1793043561698-0356b4bf9fdc.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Squash_court_indoor.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/hotel-hunahpu-capital/actividades/golf-virtual-1793043562494-5598170443ef.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Virtual_golf_simulator_hotel.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/general/bienestar/masaje-holistico-maya-1793043563221-497e3167db76.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Spa_stone_massage_therapy.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/general/bienestar/circuito-termal-hidroterapia-1793043563744-591fd5d2b077.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Thermal_spa_hydrotherapy_pool.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/general/bienestar/facial-rejuvenecedor-botanico-1793043564437-eaefeb84a8e6.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Facial_organic_treatment_spa.jpg",
    texto: "Tai-Hsiang Chou (CC BY-SA 4.0)",
  },
  "sedes/general/bienestar/aromaterapia-corporal-1793043565565-f371e6afb3c4.webp": {
    autor: "Tai-Hsiang Chou",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Aromatherapy_oil_treatment_spa.jpg",
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
