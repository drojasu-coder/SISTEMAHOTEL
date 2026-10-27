"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("pagina_inicio");

    if (!tableInfo.logo_horizontal_color_key) {
      await queryInterface.addColumn("pagina_inicio", "logo_horizontal_color_key", {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "branding/logos/hotel-hunahpu-logo-horizontal-color.svg",
      });
    }

    if (!tableInfo.logo_horizontal_blanco_key) {
      await queryInterface.addColumn("pagina_inicio", "logo_horizontal_blanco_key", {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg",
      });
    }

    if (!tableInfo.isotipo_color_key) {
      await queryInterface.addColumn("pagina_inicio", "isotipo_color_key", {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "branding/logos/hotel-hunahpu-isotipo-color.svg",
      });
    }

    // Asegurar valores por defecto en registro id=1 si estuvieran nulos
    await queryInterface.sequelize.query(`
      UPDATE pagina_inicio
      SET logo_horizontal_color_key = COALESCE(logo_horizontal_color_key, 'branding/logos/hotel-hunahpu-logo-horizontal-color.svg'),
          logo_horizontal_blanco_key = COALESCE(logo_horizontal_blanco_key, 'branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg'),
          isotipo_color_key = COALESCE(isotipo_color_key, 'branding/logos/hotel-hunahpu-isotipo-color.svg')
      WHERE id = 1;
    `);
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable("pagina_inicio");

    if (tableInfo.logo_horizontal_color_key) {
      await queryInterface.removeColumn("pagina_inicio", "logo_horizontal_color_key");
    }
    if (tableInfo.logo_horizontal_blanco_key) {
      await queryInterface.removeColumn("pagina_inicio", "logo_horizontal_blanco_key");
    }
    if (tableInfo.isotipo_color_key) {
      await queryInterface.removeColumn("pagina_inicio", "isotipo_color_key");
    }
  },
};
