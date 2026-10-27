"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pagina_inicio", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      hero_titulo: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "HOTEL HUNAHPÚ",
      },
      hero_subtitulo: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:
          "Hospedaje de distinción, gastronomía y bienestar en los destinos más emblemáticos de Guatemala.",
      },
      hero_imagen_key: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "branding/inicio/hero-portada-1793003000001.webp",
      },
      hero_imagen_alt: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Vista panorámica de HOTEL HUNAHPÚ en Guatemala",
      },
      hero_cta_texto: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "Reservar estancia",
      },
      hero_cta_enlace: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "/crear-reserva",
      },
      presentacion_titulo: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Hospitalidad con identidad y excelencia",
      },
      presentacion_texto: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:
          "En HOTEL HUNAHPÚ fusionamos el confort contemporáneo con la riqueza cultural y natural de Guatemala. Nuestras cuatro sedes en Antigua Guatemala, Lago de Atitlán, Quetzaltenango y Ciudad de Guatemala ofrecen experiencias inolvidables concebidas para el descanso, los negocios y la celebración.",
      },
      presentacion_imagen_key: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "branding/inicio/presentacion-hotel-1793003000002.webp",
      },
      presentacion_imagen_alt: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Arquitectura y hospitalidad de HOTEL HUNAHPÚ",
      },
      presentacion_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sedes_titulo: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Nuestras Sedes",
      },
      sedes_subtitulo: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:
          "Cuatro destinos únicos diseñados para conectar con la belleza y serenidad de Guatemala.",
      },
      sedes_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      experiencias_titulo: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Servicios y Experiencias",
      },
      experiencias_subtitulo: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:
          "Gastronomía refinada, bienestar integral, actividades deportivas y salones para eventos memorables.",
      },
      experiencias_imagen_key: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "branding/inicio/experiencias-servicios-1793003000003.webp",
      },
      experiencias_imagen_alt: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Experiencias de hospitalidad y descanso en HOTEL HUNAHPÚ",
      },
      experiencias_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      contacto_titulo: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Información y Reservas",
      },
      contacto_texto: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:
          "Estamos a su disposición para coordinar su estancia, eventos y experiencias personalizadas en cualquiera de nuestras sedes.",
      },
      contacto_telefono: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "+502 2222-3333",
      },
      contacto_email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "reservas@hotelhunapu.com",
      },
      contacto_direccion: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Guatemala, Centroamérica",
      },
      contacto_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.bulkInsert("pagina_inicio", [
      {
        id: 1,
        hero_titulo: "HOTEL HUNAHPÚ",
        hero_subtitulo:
          "Hospedaje de distinción, gastronomía y bienestar en los destinos más emblemáticos de Guatemala.",
        hero_imagen_key: "branding/inicio/hero-portada-1793003000001.webp",
        hero_imagen_alt: "Vista panorámica de HOTEL HUNAHPÚ en Guatemala",
        hero_cta_texto: "Reservar estancia",
        hero_cta_enlace: "/crear-reserva",
        presentacion_titulo: "Hospitalidad con identidad y excelencia",
        presentacion_texto:
          "En HOTEL HUNAHPÚ fusionamos el confort contemporáneo con la riqueza cultural y natural de Guatemala. Nuestras cuatro sedes en Antigua Guatemala, Lago de Atitlán, Quetzaltenango y Ciudad de Guatemala ofrecen experiencias inolvidables concebidas para el descanso, los negocios y la celebración.",
        presentacion_imagen_key: "branding/inicio/presentacion-hotel-1793003000002.webp",
        presentacion_imagen_alt: "Arquitectura y hospitalidad de HOTEL HUNAHPÚ",
        presentacion_visible: true,
        sedes_titulo: "Nuestras Sedes",
        sedes_subtitulo:
          "Cuatro destinos únicos diseñados para conectar con la belleza y serenidad de Guatemala.",
        sedes_visible: true,
        experiencias_titulo: "Servicios y Experiencias",
        experiencias_subtitulo:
          "Gastronomía refinada, bienestar integral, actividades deportivas y salones para eventos memorables.",
        experiencias_imagen_key: "branding/inicio/experiencias-servicios-1793003000003.webp",
        experiencias_imagen_alt: "Experiencias de hospitalidad y descanso en HOTEL HUNAHPÚ",
        experiencias_visible: true,
        contacto_titulo: "Información y Reservas",
        contacto_texto:
          "Estamos a su disposición para coordinar su estancia, eventos y experiencias personalizadas en cualquiera de nuestras sedes.",
        contacto_telefono: "+502 2222-3333",
        contacto_email: "reservas@hotelhunapu.com",
        contacto_direccion: "Guatemala, Centroamérica",
        contacto_visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("pagina_inicio");
  },
};
