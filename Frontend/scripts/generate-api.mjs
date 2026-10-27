import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(frontendDir, '..', 'backend');
const openapiPath = path.join(backendDir, 'openapi.json');
const outputDir = path.join(frontendDir, 'src', 'api', 'generated');
const outputPath = path.join(outputDir, 'schema.ts');

console.log('[api:generate] 1/3 Exportando OpenAPI desde backend...');
execSync('npm run openapi:export', { cwd: backendDir, stdio: 'inherit' });

if (!fs.existsSync(openapiPath)) {
  console.error(`[api:generate] Error: no se encontró ${openapiPath}`);
  process.exit(1);
}

console.log('[api:generate] 2/3 Generando tipos TypeScript directamente desde openapi.json...');
const rawSpec = fs.readFileSync(openapiPath, 'utf8');
const spec = JSON.parse(rawSpec);

const ast = await openapiTS(spec);
const tsOutput = astToString(ast);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, tsOutput, 'utf8');

console.log('[api:generate] 3/3 Limpiando backend/openapi.json temporal...');
fs.unlinkSync(openapiPath);

const pathsCount = Object.keys(spec.paths || {}).length;
console.log(`[api:generate] Tipos generados exitosamente en: ${outputPath} (${pathsCount} paths procesados)`);
