const db =
  require("../../src/models");

const {
  Carrito,
} = db;

interface CreateCarritoFixtureOptions {
  usuario_id: number;
  estado?: string;
  expira_en?: Date | string | null;
}

export const createCarritoFixture =
  async (
    options:
      CreateCarritoFixtureOptions
  ) => {
    return Carrito.create({
      usuario_id:
        options.usuario_id,

      estado:
        options.estado ??
        "activo",

      expira_en:
        options.expira_en !==
        undefined
          ? options.expira_en
          : new Date(
              Date.now() +
                30 *
                  60 *
                  1000
            ),
    });
  };