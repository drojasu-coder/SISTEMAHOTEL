"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PaginaInicio extends Model {}

  PaginaInicio.init(
    {
      hero_titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "HOTEL HUNAHPÚ",
      },
      hero_subtitulo: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "Hospedaje de distinción, gastronomía y bienestar en los destinos más emblemáticos de Guatemala.",
      },
      hero_imagen_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "branding/inicio/hero-portada-1793003000001.webp",
      },
      hero_imagen_alt: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Vista panorámica de HOTEL HUNAHPÚ en Guatemala",
      },
      hero_cta_texto: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "Reservar estancia",
      },
      hero_cta_enlace: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "/crear-reserva",
      },
      presentacion_titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Hospitalidad con identidad y excelencia",
      },
      presentacion_texto: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "En HOTEL HUNAHPÚ fusionamos el confort contemporáneo con la riqueza cultural y natural de Guatemala. Nuestras cuatro sedes en Antigua Guatemala, Lago de Atitlán, Quetzaltenango y Ciudad de Guatemala ofrecen experiencias inolvidables concebidas para el descanso, los negocios y la celebración.",
      },
      presentacion_imagen_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "branding/inicio/presentacion-hotel-1793003000002.webp",
      },
      presentacion_imagen_alt: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Arquitectura y hospitalidad de HOTEL HUNAHPÚ",
      },
      presentacion_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sedes_titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Nuestras Sedes",
      },
      sedes_subtitulo: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "Cuatro destinos únicos diseñados para conectar con la belleza y serenidad de Guatemala.",
      },
      sedes_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      experiencias_titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Servicios y Experiencias",
      },
      experiencias_subtitulo: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "Gastronomía refinada, bienestar integral, actividades deportivas y salones para eventos memorables.",
      },
      experiencias_imagen_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "branding/inicio/experiencias-servicios-1793003000003.webp",
      },
      experiencias_imagen_alt: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Experiencias de hospitalidad y descanso en HOTEL HUNAHPÚ",
      },
      experiencias_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      contacto_titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Información y Reservas",
      },
      contacto_texto: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "Estamos a su disposición para coordinar su estancia, eventos y experiencias personalizadas en cualquiera de nuestras sedes.",
      },
      contacto_telefono: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "+502 2222-3333",
      },
      contacto_email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "reservas@hotelhunapu.com",
      },
      contacto_direccion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Guatemala, Centroamérica",
      },
      contacto_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      logo_horizontal_color_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "branding/logos/hotel-hunahpu-logo-horizontal-color.svg",
      },
      logo_horizontal_blanco_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg",
      },
      isotipo_color_key: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "branding/logos/hotel-hunahpu-isotipo-color.svg",
      },
    },
    {
      sequelize,
      modelName: "PaginaInicio",
      tableName: "pagina_inicio",
      timestamps: true,
    }
  );

  return PaginaInicio;
};
