// Unit checks of the actual routing functions. No authentication is simulated.
// This does not establish successful interactive Google authentication.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const requireSource = (name) => {
    assert.ok(name.startsWith('.') || name.startsWith('@/'), 'Only actual local source modules are allowed');
    return load((name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name)) + '.ts');
  };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: requireSource, URL, URLSearchParams,
    window: { location: { origin: 'http://localhost:5173' } } }, { filename: file });
  return module.exports;
}
const { safeReturnPath } = load(path.join(root, 'features/auth/secureReturn.ts'));
const { getPostLoginRoute } = load(path.join(root, 'features/auth/routing.ts'));
let count = 0;
const check = (name, work) => { work(); count++; console.log('PASS', name); };
check('reject external, encoded, backslash, normalized and authentication destinations', () => {
  for (const path of ['https://evil.example', '//evil.example', '/\\evil.example', '/%5cevil.example', '/%2f%2fevil.example', '/x/../cuenta', '/login', '/registro', '/cuenta#token', '/cuenta\n', {}, null]) {
    assert.equal(safeReturnPath(path), null);
  }
});
check('reservation return retains selection but strips prices, identity and tokens', () => {
  assert.equal(safeReturnPath('/reservar?habitacion_id=12&sede=1&fecha_entrada=2026-11-10&token=secret&precio=1&rol=admin'),
    '/reservar?habitacion_id=12&sede=1&fecha_entrada=2026-11-10');
});
check('customer returns to reservations and cannot return into administration', () => {
  const user = { rol: 'cliente' };
  assert.equal(getPostLoginRoute(user, '/mis-reservas'), '/mis-reservas');
  assert.equal(getPostLoginRoute(user, '/reservar?habitacion_id=12'), '/reservar?habitacion_id=12');
  for (const route of ['/admin', '/admin/pagos', '/admin/personal', '//evil.example', '/\\evil.example']) {
    assert.equal(getPostLoginRoute(user, route), getPostLoginRoute(user));
  }
});
check('staff destinations respect permissions and do not enter customer checkout', () => {
  assert.equal(getPostLoginRoute({ rol: 'admin' }, '/admin/pagos'), '/admin/pagos');
  const receptionist = { rol: 'recepcionista' };
  assert.equal(getPostLoginRoute(receptionist, '/admin/reservas'), '/admin/reservas');
  for (const route of ['/admin/pagos', '/checkout']) {
    assert.equal(getPostLoginRoute(receptionist, route), getPostLoginRoute(receptionist));
  }
});
console.log(`${count} routing checks passed. These are unit checks, not Google sign-in evidence.`);
