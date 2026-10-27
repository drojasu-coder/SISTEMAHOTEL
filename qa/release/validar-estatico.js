// Verificación de sintaxis y rutas de importación de los archivos intervenidos.
const fs=require('fs');const path=require('path');
const ts=require(process.env.TYPESCRIPT_MODULE_PATH||require.resolve('typescript',{paths:[path.resolve('Frontend'),path.resolve('backend')]}));
const changed=fs.readFileSync('qa/release/archivos-modificados.txt','utf8').trim().split('\n');
let issues=[];let parsed=0;let importsChecked=0;
for(const file of changed){
  if(!/\.(tsx?|jsx?)$/.test(file))continue;
  parsed++;const src=fs.readFileSync(file,'utf8');
  const result=ts.transpileModule(src,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  for(const e of result.diagnostics||[]){if(e.category===ts.DiagnosticCategory.Error)issues.push(file+' TS syntax: '+ts.flattenDiagnosticMessageText(e.messageText,' '));}
  const ast=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  for(const statement of ast.statements){
    if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;
    const target=statement.moduleSpecifier.text;
    if(!(target.startsWith('@/')||target.startsWith('.')))continue;
    importsChecked++;
    const base=target.startsWith('@/')?path.resolve('Frontend/src',target.slice(2)):path.resolve(path.dirname(file),target);
    if(![base,base+'.ts',base+'.tsx',base+'.js',base+'.jsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].some(p=>fs.existsSync(p)))issues.push(file+' no encuentra import '+target);
  }
}
const router=fs.readFileSync('Frontend/src/app/router/AppRouter.tsx','utf8');
for(const p of ['FacturacionPage','PagosAdminPage','PersonalPage'])if(!router.includes(`<${p} />`))issues.push('Ruta administrativa no montada: '+p);
if(router.includes('<ModulePlaceholderPage '))issues.push('Sigue existiendo un placeholder de modulo en AppRouter');
const factura=fs.readFileSync('backend/src/routes/habitaciones/factura.routes.ts','utf8');
const items=fs.readFileSync('backend/src/routes/habitaciones/facturaItem.routes.ts','utf8');
if(!factura.includes('requireRole(...rolesGestionFacturas, ROLES.CLIENTE)')||!items.includes('requireRole(...rolesGestionFacturas, ROLES.CLIENTE)'))issues.push('No se restringe lectura de facturación a roles autorizados');
const pagos=fs.readFileSync('Frontend/src/pages/PagosAdminPage.tsx','utf8');
if(/api\.post|api\.patch|api\.delete|createPago|reembolso\s*\(/.test(pagos))issues.push('PagosAdminPage contiene mutaciones financieras inesperadas');
console.log(`Auditoría estática: ${parsed} archivos TS/TSX procesados; ${importsChecked} imports locales; ${issues.length} incidencias`);
for(const msg of issues)console.error('ERROR:',msg);
process.exit(issues.length?1:0);
