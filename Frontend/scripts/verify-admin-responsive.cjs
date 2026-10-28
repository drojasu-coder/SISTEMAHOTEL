/** Read-only Chromium regression. Credentials must be provided outside the repository.
 * HUNAHPU_QA_CREDENTIALS_FILE=/protected/admin.json \
 * HUNAHPU_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-admin-responsive.cjs
 * Requires the real local frontend/API; performs only login and GET requests.
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.HUNAHPU_PLAYWRIGHT_MODULE || 'playwright');
let stage = 'setup';
(async () => {
  const base = new URL(process.env.HUNAHPU_FRONTEND_URL || 'http://localhost:5173');
  assert(['localhost', '127.0.0.1'].includes(base.hostname), 'Local development only');
  const credentials = JSON.parse(fs.readFileSync(process.env.HUNAHPU_QA_CREDENTIALS_FILE, 'utf8'));
  assert(credentials.email && credentials.password, 'Credentials file required');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'es-GT' });
    const unexpectedWrites = [];
    const errors = [];
    page.on('pageerror', () => errors.push('pageerror'));
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && url.pathname !== '/api/auth/login') unexpectedWrites.push(url.pathname);
    });
    stage = 'real login';
    await page.goto(new URL('/login', base).href, { waitUntil: 'networkidle' });
    await page.getByRole('combobox', { name: /^(Idioma|Language)$/ }).selectOption('es');
    await page.locator('input[name=email]').fill(credentials.email);
    await page.locator('input[name=password]').fill(credentials.password);
    const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/login' && r.request().method() === 'POST');
    await page.locator('form button[type=submit]').click();
    assert.equal((await response).status(), 200);
    await page.waitForURL(url => url.pathname === '/admin');
    await page.goto(new URL('/admin/personal', base).href, { waitUntil: 'networkidle' });
    const results = [];
    for (const locale of ['es', 'en']) {
      await page.getByRole('combobox', { name: /^(Idioma|Language)$/ }).selectOption(locale);
      for (const section of locale === 'es' ? ['Empleados', 'Usuarios'] : ['Employees', 'Users']) {
        await page.getByRole('button', { name: section, exact: true }).click();
        await page.waitForLoadState('networkidle');
        for (const width of [320, 390, 768, 1440]) {
          stage = `${locale}/${section}/${width}`;
          await page.setViewportSize({ width, height: 900 });
          const geometry = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
          assert(geometry.content <= geometry.viewport + 1, `${stage}: horizontal overflow (${geometry.content}px)`);
          assert.equal(await page.getByRole('alert').count(), 0, `${stage}: unexpected alert`);
          const search = await page.getByRole('searchbox').boundingBox();
          assert(search && search.x >= 0 && search.x + search.width <= width + 1, `${stage}: search inaccessible`);
          results.push({ locale, section, width, content: geometry.content });
        }
      }
    }
    assert.deepEqual(unexpectedWrites, [], 'Unexpected mutation');
    assert.deepEqual(errors, [], 'Browser error');
    console.log(JSON.stringify({ passed: true, checks: results, unexpectedWrites, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  // Do not print login arguments, API bodies or personal information on failure.
  console.error(`FAIL ${stage}: ${error instanceof assert.AssertionError ? error.message : error.name}`);
  process.exitCode = 1;
});
