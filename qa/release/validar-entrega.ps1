param(
  [switch]$EjecutarPruebasBackend
)
$ErrorActionPreference = 'Stop'
$Raiz = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
function Ejecutar($Titulo, $Comando, $Directorio) {
  Write-Host "`n===== $Titulo =====" -ForegroundColor Cyan
  Push-Location $Directorio
  try {
    & powershell -NoProfile -Command $Comando
    if ($LASTEXITCODE -ne 0) { throw "$Titulo FALLÓ (exit=$LASTEXITCODE)" }
    Write-Host "${Titulo}: PASS" -ForegroundColor Green
  } finally { Pop-Location }
}
Write-Host 'SISTEMAHOTEL - Verificación de entrega' -ForegroundColor Cyan
Write-Host 'No se ejecutarán migraciones, cobros ni acciones sobre Stripe.'
Ejecutar 'Frontend - tipos y compilación' 'npm run build' (Join-Path $Raiz 'Frontend')
Ejecutar 'Frontend - suite de pruebas' 'npm test' (Join-Path $Raiz 'Frontend')
Ejecutar 'Backend - validación TypeScript' 'npx tsc --noEmit' (Join-Path $Raiz 'backend')
if ($EjecutarPruebasBackend) {
  $confirmation = Read-Host 'Las pruebas backend pueden modificar tablas. Confirma que tu test conecta SOLO a hotel_test_db escribiendo hotel_test_db'
  if ($confirmation -ne 'hotel_test_db') { throw 'Pruebas backend canceladas por seguridad.' }
  $prev = $env:NODE_ENV
  try {
    $env:NODE_ENV = 'test'
    Ejecutar 'Backend - suite QA (DB guard obligatorio)' 'npm test' (Join-Path $Raiz 'backend')
  } finally { $env:NODE_ENV = $prev }
} else {
  Write-Host "`nPruebas backend con BD: NO EJECUTADAS (usar -EjecutarPruebasBackend tras verificar la conexión)" -ForegroundColor Yellow
}
Write-Host "`nRecuerda revisar manualmente: login admin/cliente, listados nuevos, permisos, reservas y estados."
