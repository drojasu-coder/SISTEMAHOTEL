/*
 * GOOGLE-02: PostgreSQL real y HTTP real, en un contenedor efímero propio.
 * No conecta a hotel_db. No usa mocks ni suplanta Google: las pruebas de reglas
 * reciben perfiles sintéticos directamente y NO acreditan un login con Google.
 * Requiere Docker y la imagen oficial postgres:16 disponible localmente.
 */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const { once } = require('node:events');

process.chdir(path.resolve(__dirname, '..'));
const name = `hotel-google02-${randomBytes(6).toString('hex')}`;
const password = randomBytes(32).toString('hex');
const docker = (args, options = {}) => spawnSync('docker', args, { encoding: 'utf8', ...options });
let started = false;
let server;
let db;
let count = 0;
const check = async (label, work) => { await work(); count++; console.log(`PASS ${label}`); };
const rejectsCode = (work, code) => assert.rejects(work, (error) => error.code === code);

async function main() {
  const launch = docker(['run', '--detach', '--rm', '--pull=never', '--name', name,
    '--publish', '127.0.0.1:55433:5432', '--tmpfs', '/var/lib/postgresql/data',
    '--env', 'POSTGRES_PASSWORD', '--env', 'POSTGRES_USER=hotel_test_user',
    '--env', 'POSTGRES_DB=hotel_test_db', 'postgres:16'],
  { env: { ...process.env, POSTGRES_PASSWORD: password } });
  if (launch.status !== 0) throw new Error('No se pudo iniciar PostgreSQL temporal; compruebe Docker y el puerto 55433');
  started = true;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (docker(['exec', name, 'pg_isready', '-U', 'hotel_test_user', '-d', 'hotel_test_db']).status === 0) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'PostgreSQL temporal debe estar listo');
  Object.assign(process.env, {
    NODE_ENV: 'test', TEST_DATABASE_URL: `postgresql://hotel_test_user:${password}@127.0.0.1:55433/hotel_test_db`,
    JWT_SECRET: randomBytes(48).toString('hex'), STRIPE_ENABLED: 'false', STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '',
    GOOGLE_LOGIN_ENABLED: 'true', GOOGLE_CLIENT_ID: '123456789-google02-validation.apps.googleusercontent.com',
    CORS_ORIGINS: 'http://localhost:5173', AUTH_RATE_LIMIT_MAX: '100', LOG_LEVEL: 'error',
    EVENT_DEPOSIT_PERCENTAGE: '30', PARK_TICKET_PRICE_ADULT: '150', PARK_TICKET_PRICE_CHILD: '75', PARK_TICKET_PRICE_FAMILY: '400',
  });
  require('ts-node').register({ transpileOnly: true });
  const Sequelize = require('sequelize');
  const bcrypt = require('bcryptjs');
  db = require('../src/models');
  const qi = db.sequelize.getQueryInterface();
  const migration = require('../src/migrations/20261028010000-google-identity.js');
  const auth = require('../src/services/auth.service');
  const google = require('../src/services/googleAuth.service');
  const { assertGoogleSchemaReady } = require('../src/services/googleSchema.service');
  const { validateGoogleClaims, verifyGoogleToken } = require('../src/services/googleToken.service');
  const { env, loadEnv } = require('../src/config/env');
  const { sanitizeLogValue } = require('../src/utils/logger');
  const transaction = (work) => db.sequelize.transaction(work);
  await require('../src/migrations/20260902063223-create-usuario.js').up(qi, Sequelize);
  await check('startup refuses Google before its schema is prepared', async () => {
    await rejectsCode(() => assertGoogleSchemaReady(), 'GOOGLE_SCHEMA_NOT_READY');
  });
  const localPassword = 'OnlyLocalTest928!';
  const local = await db.Usuario.create({ nombre: 'Local Test', email: 'local@example.test', password_hash: await bcrypt.hash(localPassword, 12), rol: 'cliente', activo: true });
  const originalHash = local.password_hash;
  await check('migration up preserves existing user and password', async () => {
    await migration.up(qi, Sequelize);
    await assertGoogleSchemaReady();
    assert.equal((await local.reload()).password_hash, originalHash);
    assert.equal(await db.Usuario.count(), 1);
  });
  await check('normalized email unique index rejects case/whitespace duplicates', async () => {
    await assert.rejects(() => db.Usuario.create({ nombre: 'Duplicate', email: ' LOCAL@example.test ', password_hash: 'unused', rol: 'cliente' }), Sequelize.UniqueConstraintError);
  });
  const profile = { sub: 'synthetic-google-1', email: 'google@example.test', nombre: 'Google Component Test' };
  let googleUser;
  await check('new external identity creates only CLIENTE with minimal fields', async () => {
    googleUser = await transaction((tx) => google.resolveGoogleUser(profile, undefined, tx));
    assert.equal(googleUser.rol, 'cliente'); assert.equal(googleUser.telefono, null);
    assert.ok(googleUser.activo); assert.equal(await db.GoogleIdentity.count(), 1);
  });
  await check('sub remains stable when Google email changes; no duplicate user', async () => {
    const same = await transaction((tx) => google.resolveGoogleUser({ ...profile, email: 'changed@example.test' }, undefined, tx));
    assert.equal(same.id, googleUser.id); assert.equal(await db.Usuario.count(), 2);
  });
  const linkProfile = { sub: 'synthetic-google-2', email: 'local@example.test', nombre: 'Ignored name' };
  await check('same email requires current password; wrong password never links', async () => {
    await rejectsCode(() => transaction((tx) => google.resolveGoogleUser(linkProfile, undefined, tx)), 'GOOGLE_LINK_REQUIRED');
    await rejectsCode(() => transaction((tx) => google.resolveGoogleUser(linkProfile, 'wrong-password', tx)), 'INVALID_CREDENTIALS');
    assert.equal(await db.GoogleIdentity.count(), 1);
  });
  await check('explicit password confirmation links without changing existing credentials', async () => {
    const linked = await transaction((tx) => google.resolveGoogleUser(linkProfile, localPassword, tx));
    assert.equal(linked.id, local.id); assert.equal(linked.password_hash, originalHash); assert.equal(linked.nombre, 'Local Test');
  });
  await check('different Google sub cannot replace existing identity', async () => {
    await rejectsCode(() => transaction((tx) => google.resolveGoogleUser({ ...linkProfile, sub: 'other-sub' }, localPassword, tx)), 'GOOGLE_IDENTITY_CONFLICT');
  });
  await check('inactive and staff accounts rejected, including previously linked accounts', async () => {
    await local.update({ activo: false });
    await rejectsCode(() => transaction((tx) => google.resolveGoogleUser(linkProfile, undefined, tx)), 'USER_INACTIVE');
    await local.update({ activo: true, rol: 'admin' });
    await rejectsCode(() => transaction((tx) => google.resolveGoogleUser(linkProfile, undefined, tx)), 'GOOGLE_CLIENT_ONLY');
    await rejectsCode(() => transaction((tx) => google.resolveGoogleUser({ ...linkProfile, sub: 'staff-other-sub' }, localPassword, tx)), 'GOOGLE_CLIENT_ONLY');
    await local.update({ rol: 'cliente' });
  });
  await check('concurrent registration leaves one user and one identity', async () => {
    const parallelProfile = { sub: 'parallel-sub', email: 'parallel@example.test', nombre: 'Parallel' };
    const results = await Promise.allSettled([1, 2].map(() => transaction((tx) => google.resolveGoogleUser(parallelProfile, undefined, tx))));
    assert.ok(results.some((r) => r.status === 'fulfilled'));
    assert.equal(await db.Usuario.count({ where: { email: parallelProfile.email } }), 1);
    assert.equal(await db.GoogleIdentity.count({ where: { sub: parallelProfile.sub } }), 1);
  });
  await check('successful completion consumes challenge atomically and rejects concurrent replay', async () => {
    const challenge = await google.createGoogleChallenge();
    const results = await Promise.allSettled([1, 2].map(() => google.completeVerifiedGoogleLogin(profile, challenge.challengeId, challenge.nonce)));
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter((r) => r.status === 'rejected' && r.reason.code === 'GOOGLE_CHALLENGE_EXPIRED').length, 1);
    assert.equal(await db.GoogleAuthChallenge.count({ where: { id: challenge.challengeId } }), 0);
  });
  await check('failed linking preserves challenge but never creates a partial identity', async () => {
    const existing = await auth.register({ nombre: 'Link rollback', email: 'rollback@example.test', password: localPassword });
    const rollbackProfile = { sub: 'rollback-sub', email: existing.email, nombre: 'Ignored' };
    const challenge = await google.createGoogleChallenge();
    await rejectsCode(() => google.completeVerifiedGoogleLogin(rollbackProfile, challenge.challengeId, challenge.nonce), 'GOOGLE_LINK_REQUIRED');
    assert.equal(await db.GoogleAuthChallenge.count({ where: { id: challenge.challengeId } }), 1);
    assert.equal(await db.GoogleIdentity.count({ where: { sub: rollbackProfile.sub } }), 0);
    await google.completeVerifiedGoogleLogin(rollbackProfile, challenge.challengeId, challenge.nonce, localPassword);
    assert.equal(await db.GoogleAuthChallenge.count({ where: { id: challenge.challengeId } }), 0);
  });
  const nonce = randomBytes(32).toString('base64url');
  const claims = { sub: 'claim-sub', iss: 'https://accounts.google.com', aud: env.GOOGLE_CLIENT_ID,
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300,
    email: 'claims@example.test', email_verified: true, nonce };
  await check('claim guards reject wrong issuer/audience/azp/expiry/nonce/unverified email', async () => {
    assert.equal(validateGoogleClaims(claims, nonce).sub, 'claim-sub');
    for (const patch of [{ iss: 'attacker' }, { aud: 'other-client' }, { azp: 'other-client' }, { exp: 0 }, { nonce: 'wrong' }, { sub: '' }]) {
      assert.throws(() => validateGoogleClaims({ ...claims, ...patch }, nonce), (e) => e.code === 'GOOGLE_INVALID_TOKEN');
    }
    assert.throws(() => validateGoogleClaims({ ...claims, email_verified: false }, nonce), (e) => e.code === 'GOOGLE_EMAIL_UNVERIFIED');
  });
  await check('official verifier rejects malformed token without exposing it', async () => {
    await rejectsCode(() => verifyGoogleToken('invalid-token-never-a-real-google-token', nonce), 'GOOGLE_INVALID_TOKEN');
  });
  await check('official verifier with current Google certificates rejects forged signature', async () => {
    const { OAuth2Client } = require('google-auth-library');
    const verifier = new OAuth2Client({ transporterOptions: { timeout: 10000 } });
    const { certs } = await verifier.getFederatedSignonCertsAsync();
    const kid = Object.keys(certs)[0]; assert.ok(kid);
    const encoded = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const forged = `${encoded({ alg: 'RS256', kid })}.${encoded(claims)}.${randomBytes(256).toString('base64url')}`;
    await rejectsCode(() => verifyGoogleToken(forged, nonce), 'GOOGLE_INVALID_TOKEN');
  });
  await check('configuration fails closed and logs redact credentials/nonces', async () => {
    assert.throws(() => loadEnv({ ...process.env, GOOGLE_CLIENT_ID: '' }));
    assert.throws(() => loadEnv({ ...process.env, GOOGLE_CLIENT_ID: 'malformed' }));
    assert.deepEqual(sanitizeLogValue({ credential: 'secret', nonce: 'secret', 'X-Google-CSRF': 'secret' }),
      { credential: '[REDACTED]', nonce: '[REDACTED]', 'X-Google-CSRF': '[REDACTED]' });
  });
  const app = require('../src/app').default;
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (endpoint, body, headers = {}) => {
    const response = await fetch(`${base}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  const origin = { Origin: 'http://localhost:5173' };
  await check('real HTTP traditional login, me and protected authorization still work', async () => {
    const login = await request('/auth/login', { email: local.email, password: localPassword });
    assert.equal(login.status, 200); assert.equal(login.body.data.usuario.id, local.id);
    const me = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${login.body.data.accessToken}` } });
    assert.equal(me.status, 200); assert.equal((await me.json()).data.rol, 'cliente');
    const privateResponse = await fetch(`${base}/usuarios`, { headers: { Authorization: `Bearer ${login.body.data.accessToken}` } });
    assert.equal(privateResponse.status, 403);
    const invalid = await request('/auth/login', { email: local.email, password: 'wrong' }); assert.equal(invalid.status, 401);
    await local.update({ activo: false });
    const inactive = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${login.body.data.accessToken}` } }); assert.equal(inactive.status, 403);
    await local.update({ activo: true });
  });
  await check('real HTTP traditional registration remains CLIENTE and rejects role injection', async () => {
    const created = await request('/auth/register', { nombre: 'Traditional', email: 'traditional@example.test', password: localPassword });
    assert.equal(created.status, 201); assert.equal(created.body.data.rol, 'cliente');
    const bad = await request('/auth/register', { nombre: 'Injected', email: 'injected@example.test', password: localPassword, rol: 'admin' }); assert.equal(bad.status, 400);
  });
  await check('real HTTP CSRF rejects missing Origin, foreign Origin and missing header', async () => {
    for (const headers of [{}, { ...origin }, { Origin: 'https://attacker.invalid', 'X-Google-CSRF': 'init' }]) {
      assert.equal((await request('/auth/google/challenge', {}, headers)).status, 403);
    }
  });
  let challenge;
  await check('real HTTP challenge and official invalid-token rejection create no account', async () => {
    const before = await db.Usuario.count();
    const response = await request('/auth/google/challenge', {}, { ...origin, 'X-Google-CSRF': 'init' });
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    challenge = response.body.data;
    const bad = await request('/auth/google', { challengeId: challenge.challengeId, credential: 'invalid' }, { ...origin, 'X-Google-CSRF': challenge.nonce });
    assert.equal(bad.status, 401); assert.equal(bad.body.code, 'GOOGLE_INVALID_TOKEN');
    assert.equal(await db.Usuario.count(), before);
  });
  await check('expired/unknown challenge, wrong nonce and role injection rejected before token verification', async () => {
    const headers = { ...origin, 'X-Google-CSRF': challenge.nonce };
    const body = { challengeId: challenge.challengeId, credential: 'invalid' };
    const injected = await request('/auth/google', { ...body, rol: 'admin' }, headers); assert.equal(injected.status, 400);
    const wrong = await request('/auth/google', body, { ...origin, 'X-Google-CSRF': randomBytes(32).toString('base64url') }); assert.equal(wrong.body.code, 'GOOGLE_CHALLENGE_EXPIRED');
    await db.GoogleAuthChallenge.update({ expires_at: new Date(0) }, { where: { id: challenge.challengeId } });
    const expired = await request('/auth/google', body, headers); assert.equal(expired.body.code, 'GOOGLE_CHALLENGE_EXPIRED');
    await db.GoogleAuthChallenge.destroy({ where: { id: challenge.challengeId } });
    await rejectsCode(() => google.loginWithGoogle(body, challenge.nonce), 'GOOGLE_CHALLENGE_EXPIRED');
  });
  await check('Google HTTP rate limiting and disabled feature fail closed', async () => {
    let limited = false;
    for (let i = 0; i < 12; i++) {
      if ((await request('/auth/google/challenge', {}, { ...origin, 'X-Google-CSRF': 'init' })).status === 429) limited = true;
    }
    assert.ok(limited);
    env.GOOGLE_LOGIN_ENABLED = false;
    assert.equal((await request('/auth/google/challenge', {}, { ...origin, 'X-Google-CSRF': 'init' })).body.code, 'GOOGLE_DISABLED');
    env.GOOGLE_LOGIN_ENABLED = true;
  });
  await check('down/up preserve users/passwords; duplicates abort migration without partial tables', async () => {
    const before = await db.Usuario.count();
    await migration.down(qi);
    assert.equal(await db.Usuario.count(), before); assert.equal((await local.reload()).password_hash, originalHash);
    const duplicate = await db.Usuario.create({ nombre: 'Conflict', email: ' LOCAL@example.test ', password_hash: 'unused', rol: 'cliente' });
    await assert.rejects(() => migration.up(qi, Sequelize));
    const [tables] = await db.sequelize.query("SELECT to_regclass('google_identities') IS NULL AS absent"); assert.equal(tables[0].absent, true);
    await duplicate.destroy();
    await migration.up(qi, Sequelize);
    assert.equal(await db.Usuario.count(), before); assert.equal((await local.reload()).password_hash, originalHash);
  });
  console.log(`${count} checks passed. No real Google sign-in was verified. hotel_db was not modified.`);
}

main().catch((error) => {
  // No imprimir objetos de errores de HTTP/Sequelize que puedan contener tokens o contraseñas.
  console.error('FAIL', error.name, error.code ?? '', error instanceof assert.AssertionError ? error.message.split('\n')[0] : 'Verification failed');
  process.exitCode = 1;
}).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.sequelize.close();
  if (started) docker(['stop', '--time', '2', name]);
});
