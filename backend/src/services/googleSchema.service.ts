import { AppError } from "../utils/AppError";

const { sequelize } = require("../models");

/** Read-only startup gate. Enabling Google must never run migrations implicitly. */
export async function assertGoogleSchemaReady(): Promise<void> {
  const [rows] = await sequelize.query(`
    SELECT
      EXISTS (SELECT 1 FROM pg_index
        WHERE indexrelid = to_regclass('usuarios_email_normalized_unique')
          AND indisunique AND indisvalid) AS email_index,
      to_regclass('google_identities') IS NOT NULL AS identities,
      to_regclass('google_auth_challenges') IS NOT NULL AS challenges,
      EXISTS (SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('google_identities') AND contype = 'p') AS identity_pk,
      EXISTS (SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('google_identities') AND contype = 'u') AS user_unique,
      EXISTS (SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('google_identities') AND contype = 'f'
          AND confrelid = to_regclass('usuarios')) AS user_fk
  `);
  if (!rows[0] || !Object.values(rows[0]).every((value) => value === true)) {
    throw new AppError(503, "GOOGLE_SCHEMA_NOT_READY", "Google Login requiere preparar y verificar su esquema antes de habilitarlo");
  }
  // Verify the model columns as well, without reading any personal data.
  await sequelize.query('SELECT sub, usuario_id, "createdAt", "updatedAt" FROM google_identities LIMIT 0');
  await sequelize.query('SELECT id, nonce_hash, expires_at FROM google_auth_challenges LIMIT 0');
}
