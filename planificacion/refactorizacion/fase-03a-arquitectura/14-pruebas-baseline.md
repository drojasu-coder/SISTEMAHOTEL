# 14. Baseline y verificaciones

## Comandos ejecutados

- `npm test`: **55 pruebas exitosas**, 11 archivos de prueba.
- `npm run typecheck`: exitoso.
- `npm audit --omit=dev`: **2 vulnerabilidades moderadas** de `uuid` vía Sequelize; corregirlas requeriría el cambio incompatible documentado por npm hacia Sequelize 3, por lo que no se actualizó.
- `git diff --stat HEAD..origin/hardening/backend-final`: lectura comparativa, sin modificar ramas.
- Conteos del árbol: 38 controladores, 40 servicios, 38 rutas, 38 validadores, 39 modelos y 41 migraciones.

La línea base conserva las pruebas de auth, pagos, reservas, Stripe, errores, seguridad HTTP, logger y configuración. No se ejecutaron migraciones destructivas ni se cambió la base de datos.

## Limitaciones de cobertura

La cobertura histórica más reciente registrada fue aproximadamente 42.15% de statements, 16.94% de branches, 24.51% de functions y 42.46% de lines. La cobertura desigual impide usar sólo pruebas unitarias como garantía para extraer servicios transaccionales.

## Estado Git

La rama verificada es `refactor/backend-architecture`, HEAD `4896e3a`. Permanece una modificación previa en `script.sql` y archivos protegidos/no rastreados; no se tocaron. Esta fase sólo añade documentación.

