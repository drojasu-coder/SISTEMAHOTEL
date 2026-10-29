/* GOOGLE-03: backup + restore rehearsal + one explicitly named migration.
 * Never accepts remote databases or production. No seeds, sync or data cleanup.
 * Default rehearses only; --apply-local also migrates localhost:5432/hotel_db.
 * Requires the existing hotel_postgres container and local postgres:16 image.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes, createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const dotenv = require('dotenv');

const root = path.resolve(__dirname, '..');
const migration = '20261028010000-google-identity.js';
const local = dotenv.parse(fs.readFileSync(path.join(root, '.env')));
const url = new URL(local.DATABASE_URL);
const apply = process.argv.includes('--apply-local');
const isolatedName = `hotel-google03-${randomBytes(6).toString('hex')}`;
const isolatedPassword = randomBytes(32).toString('hex');
const report = { migration, appliedLocal: false, checks: [] };
let started = false;
let live;
let isolated;
let reportPath;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, ...options });
  // Never relay stderr/stdout on failure: pg_restore/Sequelize can include row data.
  if (result.status !== 0) throw new Error(`Command failed: ${command}`);
  return result.stdout;
}

async function inspect(client) {
  const applied = (await client.query('SELECT name FROM "SequelizeMeta" ORDER BY name')).rows.map((r) => r.name);
  const files = fs.readdirSync(path.join(root, 'src/migrations')).filter((f) => f.endsWith('.js')).sort();
  assert.deepEqual(applied.filter((f) => !files.includes(f)), [], 'Applied migrations missing from disk');
  assert.deepEqual(files.filter((f) => !applied.includes(f)), [migration], 'Unexpected pending migrations');
  const duplicates = await client.query('SELECT count(*)::int AS n FROM (SELECT lower(btrim(email)) FROM usuarios GROUP BY 1 HAVING count(*) > 1) d');
  assert.equal(duplicates.rows[0].n, 0, 'Duplicate normalized emails');
  const state = (await client.query("SELECT to_regclass('google_identities') IS NULL AND to_regclass('google_auth_challenges') IS NULL AND to_regclass('usuarios_email_normalized_unique') IS NULL AS clean")).rows[0];
  assert.equal(state.clean, true, 'Partial Google schema already exists');
  return { applied: applied.length, pending: [migration], duplicateGroups: 0 };
}

async function snapshot(client) {
  // Only aggregates leave PostgreSQL. Includes every original table and password hashes.
  const names = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('SequelizeMeta','google_identities','google_auth_challenges') ORDER BY tablename")).rows.map((r) => r.tablename);
  const result = {};
  for (const name of names) {
    const quoted = '"' + name.replaceAll('"', '""') + '"';
    result[name] = (await client.query(`SELECT count(*)::int AS count, md5(coalesce(string_agg(h, '' ORDER BY h), '')) AS digest FROM (SELECT md5(row_to_json(t)::text) AS h FROM ${quoted} t) s`)).rows[0];
  }
  return result;
}

function migrate(databaseUrl, environment) {
  run(process.execPath, ['node_modules/sequelize-cli/lib/sequelize', 'db:migrate', '--env', environment, '--name', migration], {
    cwd: root,
    env: { ...process.env, ...local, NODE_ENV: environment, DATABASE_URL: databaseUrl,
      TEST_DATABASE_URL: environment === 'test' ? databaseUrl : '', GOOGLE_LOGIN_ENABLED: 'false' },
  });
}

async function verifySchema(client) {
  const state = (await client.query("SELECT to_regclass('google_identities') IS NOT NULL AS identities, to_regclass('google_auth_challenges') IS NOT NULL AS challenges, EXISTS(SELECT 1 FROM pg_index WHERE indexrelid=to_regclass('usuarios_email_normalized_unique') AND indisunique AND indisvalid) AS email_index")).rows[0];
  assert.ok(Object.values(state).every(Boolean), 'Incomplete Google schema');
  assert.equal((await client.query('SELECT count(*)::int AS n FROM "SequelizeMeta" WHERE name=$1', [migration])).rows[0].n, 1);
  return state;
}

async function main() {
  assert.ok(process.argv.slice(2).every((a) => a === '--apply-local'), 'Unknown argument');
  assert.notEqual(process.env.NODE_ENV, 'production');
  assert.ok(!local.NODE_ENV || local.NODE_ENV === 'development');
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  assert.equal(url.port || '5432', '5432');
  assert.equal(url.pathname, '/hotel_db');
  assert.ok(['postgres:', 'postgresql:'].includes(url.protocol));
  assert.equal(url.search, '', 'Database URL options not allowed');
  // Check the dump container exposes exactly the configured local database port.
  const ports = run('docker', ['port', 'hotel_postgres', '5432/tcp']);
  assert.ok(ports.split('\n').some((line) => /^(127\.0\.0\.1|0\.0\.0\.0):5432$/.test(line)));
  live = new Client({ connectionString: local.DATABASE_URL });
  await live.connect();
  assert.equal((await live.query('SELECT current_database() AS db')).rows[0].db, 'hotel_db');
  report.preflight = await inspect(live);
  console.log('PASS local target, no duplicates, only Google migration pending');
  const dir = path.join(root, 'backups', `google03-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  reportPath = path.join(dir, 'verification.json');
  const dumpPath = path.join(dir, 'hotel_db-before-google.dump');
  const dump = run('docker', ['exec', '--env', 'PGPASSWORD', 'hotel_postgres', 'pg_dump', '-h', '127.0.0.1', '-U', decodeURIComponent(url.username), '-d', 'hotel_db', '--format=custom', '--no-owner', '--no-acl'], {
    encoding: null, env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
  });
  fs.writeFileSync(dumpPath, dump, { mode: 0o600, flag: 'wx' });
  report.backup = { path: dumpPath, bytes: dump.length, sha256: createHash('sha256').update(dump).digest('hex') };
  console.log(`PASS backup saved privately: ${dumpPath}`);
  run('docker', ['run', '--detach', '--rm', '--pull=never', '--name', isolatedName, '--publish', '127.0.0.1:55433:5432', '--tmpfs', '/var/lib/postgresql/data', '--env', 'POSTGRES_PASSWORD', '--env', 'POSTGRES_USER=hotel_test_user', '--env', 'POSTGRES_DB=hotel_test_db', 'postgres:16'], {
    env: { ...process.env, POSTGRES_PASSWORD: isolatedPassword },
  });
  started = true;
  let ready = false;
  for (let i = 0; i < 30; i++) {
    if (spawnSync('docker', ['exec', isolatedName, 'pg_isready', '-U', 'hotel_test_user', '-d', 'hotel_test_db']).status === 0) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Isolated PostgreSQL unavailable');
  run('docker', ['exec', '-i', isolatedName, 'pg_restore', '-U', 'hotel_test_user', '-d', 'hotel_test_db', '--no-owner', '--no-acl', '--exit-on-error'], { input: dump, encoding: null });
  const testUrl = `postgresql://hotel_test_user:${isolatedPassword}@127.0.0.1:55433/hotel_test_db`;
  isolated = new Client({ connectionString: testUrl });
  await isolated.connect();
  await inspect(isolated);
  const before = await snapshot(isolated);
  migrate(testUrl, 'test');
  report.isolatedSchema = await verifySchema(isolated);
  assert.deepEqual(await snapshot(isolated), before, 'Rehearsal changed existing rows');
  report.checks.push('Full backup restored to isolated PostgreSQL; exact migration preserved every existing table');
  report.counts = Object.fromEntries(Object.entries(before).map(([name, value]) => [name, value.count]));
  console.log('PASS restore rehearsal, Google schema, all original rows and hashes unchanged');
  if (apply) {
    await inspect(live); // repeat immediately before modifying the local database
    const liveBefore = await snapshot(live);
    assert.deepEqual(liveBefore, before, 'Live rows changed since backup; take a fresh backup');
    migrate(local.DATABASE_URL, 'development');
    report.localSchema = await verifySchema(live);
    assert.deepEqual(await snapshot(live), liveBefore, 'Existing rows changed during local migration');
    report.appliedLocal = true;
    report.checks.push('Only Google migration applied locally; every original row/hash preserved');
    console.log('PASS local migration and preservation of all existing data');
  }
  console.log('Google flags were not enabled. Production was not contacted.');
}

main().catch((error) => {
  report.error = error instanceof assert.AssertionError ? error.message.split('\n')[0] : 'Preparation failed; inspect locally without disclosing data';
  console.error('FAIL', report.error);
  process.exitCode = 1;
}).finally(async () => {
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
  if (live) await live.end();
  if (isolated) await isolated.end();
  if (started) spawnSync('docker', ['stop', '--time', '2', isolatedName], { stdio: 'ignore' });
});
