# Google Identity Services — GOOGLE-02 y GOOGLE-03

## GOOGLE-03 — Validación local, 28 de octubre de 2026 (Guatemala)

**Estado: en curso. La autenticación interactiva con Google todavía no está acreditada.** Migración local, Client ID y botón oficial están preparados. Google responde `The given origin is not allowed for the given client ID`; falta corregir o esperar la propagación de los orígenes OAuth y completar el flujo manual. Ninguna prueba con perfiles sintéticos se presenta como un acceso real a Google.

### Base de datos real y respaldo

- Destino comprobado: `127.0.0.1:5432/hotel_db`, contenedor local `hotel_postgres`. No se contactó producción ni AWS.
- Inventario previo: 61 archivos de migración, 60 aplicados, ninguno aplicado sin archivo. La única pendiente era `20261028010000-google-identity.js`. La de `expira_en` ya estaba aplicada y no se volvió a ejecutar.
- Prevalidación: cero grupos duplicados por `lower(btrim(email))`; las tablas/índice de Google no existían.
- Respaldo completo en formato custom, 158557 bytes, directorio privado y archivo con permisos 0600, excluido de Git: `backend/backups/google03-2026-10-29T05-01-02-364Z/hotel_db-before-google.dump`.
- SHA-256: `bb7da50b31daab6b7f766587d2082e3d7279a281ecbcdd9da337a9272f980002`.
- Se restauró realmente el respaldo completo en un PostgreSQL 16 aislado (`127.0.0.1:55433/hotel_test_db`) y se aplicó únicamente la migración nombrada mediante `db:migrate --name`. Se verificaron tablas, índice único válido y registro en `SequelizeMeta`.
- Antes de migrar localmente se repitieron los controles de pendientes/duplicados y se comprobó que el respaldo seguía correspondiendo a los datos vivos. Después se compararon conteos y resúmenes de **todas las filas de las 43 tablas originales**, incluyendo hashes de contraseña. No cambiaron.
- Conservados: 4 sedes, 276 habitaciones, 22 usuarios, 16 reservas de habitación, 3 reservas de mesa, 2 reservas de amenidades, 3 pagos y 3 facturas. Se añadieron únicamente `google_identities`, `google_auth_challenges`, el índice único normalizado y la entrada de migración.
- Evidencia agregada sin datos personales: `backend/backups/google03-2026-10-29T05-01-02-364Z/verification.json`. El contenedor aislado del ensayo se retiró; el respaldo se conserva localmente.

Procedimiento reproducible: `node backend/scripts/prepare-google-local.cjs` respalda y ensaya; `--apply-local` aplica además en la base local, después de todos los controles. Rechaza producción, hosts remotos, opciones en la URL, migraciones inesperadas, correos duplicados y esquemas parciales. No es un migrador de producción ni debe repetirse sobre un esquema ya migrado. No ejecuta seeds ni elimina registros de la base local.

### Configuración y cambios de esta fase

- `GOOGLE_CLIENT_ID` es la audiencia del verificador oficial; `VITE_GOOGLE_CLIENT_ID` se incorpora al frontend. Ambos deben coincidir exactamente con un cliente OAuth de tipo Aplicación web. No se usa Client Secret.
- El frontend compara el ID recibido del backend antes de cargar GIS; ambos lados rechazan un flag habilitado sin ID válido. Los `.env` están ignorados; se amplió `.gitignore` para cubrir `.env.local` y `.env.*.local`.
- El propietario introdujo el ID real en ambos archivos locales; se comprobó coincidencia sin imprimirlo y se habilitaron ambos flags **solo localmente**, después de comprobar el esquema. No se copia el ID a código ni a documentación. El ID público aparece necesariamente en las peticiones GIS del navegador; no es un Client Secret.
- `assertGoogleSchemaReady` añade una barrera de arranque de solo lectura si Google está habilitado: tablas, columnas, índice válido y restricciones de identidad deben existir. Nunca migra automáticamente.
- Vite local envía `Cross-Origin-Opener-Policy: same-origin-allow-popups` y `Referrer-Policy: no-referrer-when-downgrade`, según la [configuración de GIS](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid). No se cambiaron cabeceras de Nginx/producción.
- Servicios locales accesibles: API en 4000 (`/api/health` HTTP 200), frontend en 5173 (HTTP 200), PostgreSQL en 5432.

### Resultados de comprobación y límites

| Comprobación | Resultado y alcance |
| --- | --- |
| TypeScript backend `typecheck` | Correcto |
| TypeScript frontend `typecheck` | Correcto |
| Build frontend | Correcto; advertencia de bundle mayor de 500 kB |
| Backend `typecheck:all` | Falla en `scripts/deploy-catalog-and-media.ts:34` (TS7016, falta declaración de `../src/models`); el chequeo de `src` sí pasa. No se ejecutó ese script de despliegue |
| `verify:google` | 23 comprobaciones satisfactorias con PostgreSQL/HTTP reales aislados, incluida la barrera de esquema nueva |
| Autenticación tradicional | Registro, login bcrypt, `/me`, contraseña inválida, cuenta inactiva e inyección de rol comprobados por HTTP en PostgreSQL aislado |
| Navegador local tradicional | Login ES/EN y traducción de errores de campos obligatorios comprobados; aún sin sesión manual en la base local |
| Protección Google | Personal, inactivos, vinculación con contraseña, conflictos, concurrencia, consumo de desafío, CSRF, expiración y rate limit comprobados en la suite aislada. Las reglas de identidad usan perfiles sintéticos |
| Verificación criptográfica | Tokens malformados y firma falsificada rechazados por la biblioteca oficial con certificados actuales de Google; no equivale a un token válido |
| Retorno después de autenticar | `npm --prefix Frontend run verify:auth-return`: 4 grupos de pruebas unitarias sobre funciones reales; bloquea destinos externos, barras inversas/codificaciones, vuelta de cliente a administración; conserva selección de habitación y filtra secretos/importes de la URL |
| Botón oficial | Renderizado por GIS en login/registro ES/EN, móvil de 375 px (botón 286 px) y escritorio de 1280 px (botón 350 px); sin desbordamiento horizontal. Se detectó y corrigió idioma desactualizado al cambiar ES/EN, recargando GIS con `hl` y serializando las cargas por idioma |
| Desafíos contra API local | HTTP 200 y `Cache-Control: no-store`; el límite respondió HTTP 429 tras múltiples preparaciones/cambios de idioma, sin crear usuarios ni identidades |
| Popup, alta Google, segundo acceso y panel | Intento de clic real, bloqueado por origen OAuth no autorizado según GIS. Pendiente de corrección/propagación y selección/consentimiento manual |
| Cuenta existente y reservas | Migración conserva íntegramente sus datos; la vinculación real con Google y contraseña introducida por el propietario sigue pendiente |

No se capturan ni imprimen contraseñas, tokens o respuestas completas de autenticación como evidencia.

Capturas locales sin credenciales: `/tmp/hotel-google03/login-es-375.png`, `/tmp/hotel-google03/registro-es-375.png`, `/tmp/hotel-google03/registro-en-1280.png`. Acreditan el botón oficial y el diseño; no un login satisfactorio. Al comprobar el bloqueo había 22 usuarios y cero identidades Google.

Graphify: índices de backend, frontend y raíz actualizados mediante extracción de código (sin LLM, 0 tokens de extracción semántica). El parser SQL opcional no está instalado y algunos archivos sin símbolos no aportan nodos; la actualización CLI no refresca semánticamente documentos. El grafo raíz contiene 4585 nodos en esta actualización; no se forzó ninguna protección contra reducción.

### Vulnerabilidades verificadas con npm audit

Consulta realizada en esta fase: backend **7 paquetes (2 altos, 5 moderados)**; no son siete causas independientes: ExcelJS y Sequelize heredan la alerta de UUID. No se ejecutó `npm audit fix`, ni se cambiaron versiones o lockfiles por esta auditoría.

| Paquete instalado | Corrección identificada | Impacto y validación antes de actualizar |
| --- | --- | --- |
| `body-parser 2.3.0`, alta | `2.4.0` | Dependencia de Express. El parsing global de cuerpos comprimidos hace relevante el DoS antes de autenticar. Actualización menor; comprobar JSON, formularios, límites y webhook Stripe con cuerpo crudo. [Aviso](https://github.com/advisories/GHSA-27r3-jxmh-p828) |
| `fast-uri 3.1.8`, moderada | `3.1.9` en la rama actual | Llega por `swagger-jsdoc → swagger-parser → ajv`. Cuatro avisos sobre normalización/interpretación de URI. Parche; validar generación y validación de OpenAPI. No se observó uso directo para destinos del login. [Aviso principal](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) |
| `qs 6.16.0`, moderada | `6.16.1` | El aviso depende de `stringify` con `arrayFormat: comma` y datos hostiles; no se encontró ese uso directo en `src`. Parche; comprobar serialización y parsing de consultas. [Aviso](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) |
| `uuid 8.3.2`, moderada | `11.1.1` (también ramas corregidas `12.0.1` y `13.0.1`) | Salto mayor; revisar compatibilidad CommonJS y las dependencias consumidoras antes de un override. El fallo afecta v3/v5/v6 con buffer suministrado; los usos inspeccionados de ExcelJS/Sequelize son v4/v1. Google usa `crypto.randomUUID`. [Aviso](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| `exceljs 4.4.0`, moderada heredada | Sin versión superior corregida publicada en la consulta; depende de UUID `^8.3.0` | `npm audit` propone bajar a `3.4.0`: no es una actualización segura. Evaluar override controlado de UUID o solución upstream y probar exportaciones Excel/formatos condicionales |
| `sequelize 6.37.8`, moderada heredada | Sin versión superior corregida publicada en la consulta; depende de UUID `^8.3.2` | `npm audit` propone bajar a `3.30.0`: incompatible como solución automática. Evaluar UUID corregido con pruebas de transacciones, modelos, migraciones y generación de identificadores |
| `zod 4.6.5`, alta | `4.6.6` | Parche; agotamiento de memoria al validar colecciones grandes. Comprobar errores/validadores y límites del cuerpo HTTP; el límite existente no acredita ausencia de riesgo. [Aviso](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

Hallazgo adicional frontend: **4 paquetes (1 alto, 3 moderados)**. `postcss-selector-parser 6.1.4 → 6.1.5` es un parche del procesamiento CSS; `react-router`/`react-router-dom 6.30.6` requieren evaluar salto a `7.18.0+` (audit ofrece `7.18.5`), con regresión completa de navegación y permisos; `zod 3.25.76 → 4.6.6+` es un salto mayor que exige adaptar el resolver React Hook Form, error maps y esquemas. La app es SPA, no SSR; las funciones de retorno actuales rechazan barras inversas, pero esto no sustituye la actualización de React Router ni audita todas las navegaciones. Los reportes JSON originales permanecen en `/tmp/hotel-google03/` como evidencia temporal.

### Pruebas antiguas eliminadas y cobertura perdida

Se comparó el árbol de trabajo con `HEAD`: **231 archivos de pruebas eliminados previamente (120 frontend, 111 backend)**, además de fixtures, helpers, configuración y Docker Compose de pruebas. Los scripts `test`, `test:coverage`, `test:integration` y dependencias Vitest/Testing Library/Supertest también fueron retirados previamente. No se borró ni restauró ninguna de esas pruebas en GOOGLE-03.

Hay pérdida de cobertura ejecutable: 8 archivos de autenticación frontend (formularios, RequireAuth, continuidad, permisos, borrador, retorno y pestañas), 13 de autenticación/autorización backend y 17 de integración backend, además de pagos, reservas, concurrencia, reportes y componentes. No se puede cuantificar un porcentaje de cobertura sin recuperar el entorno de medición. Las 23 comprobaciones Google y los 4 grupos nuevos de retorno cubren una parte; **no reemplazan la suite anterior ni prueban toda la regresión hotelera**.

### Privacidad y autorización de producción

Se corrigió la conservación ES/EN: desafíos de diez minutos, eliminación al completar o en un siguiente intento tras vencer, vínculos/cuentas sin eliminación automática; se describe la transferencia técnica al cargar GIS antes del clic, el token temporal en memoria, la ausencia de recuperación/desvinculación y que salir del hotel no cierra Google.

Sigue pendiente aprobación legal del responsable para ambos idiomas: responsable y contacto reales, base y finalidades del tratamiento, Google como proveedor, transferencias y datos técnicos, plazos de conservación, solicitudes de derechos y fecha de publicación. No se declara obtenida esa aprobación ni se publica el texto en producción.

Antes de producción se requiere: completar alta/segundo acceso/vinculación real y conservación de reservas; validar móvil y navegadores compatibles; resolver o aceptar formalmente riesgos de dependencias con pruebas; recuperar cobertura crítica; aprobar privacidad y configuración OAuth del dominio HTTPS; revisar CSP/COOP, CORS, proxy, no-cache y redacción de logs; preparar respaldo y ensayo sobre copia del esquema de producción; revisar sus pendientes de migración por separado y obtener una instrucción nueva para desplegar/migrar/activar. Desactivar flags conserva las identidades; no usar `down` como apagado tras crear cuentas Google. **No se modificó producción, no hubo commit, push, merge ni despliegue.**

---

## Registro histórico de GOOGLE-02

Estado al 28 de octubre de 2026: implementación preparada para revisión y desactivada por defecto. No se configuró un Client ID real, no se aplicó la migración a `hotel_db` y no se activó ni desplegó en producción. El acceso satisfactorio con una cuenta real de Google sigue pendiente.

## Auditoría y decisiones

El sistema existente registra clientes mediante `/api/auth/register`, valida bcrypt en `/api/auth/login` y emite un JWT de acceso cuyo subject es el ID interno de `usuarios`. `authMiddleware` consulta en PostgreSQL el rol y `activo` en cada petición; no se encontró otro campo de bloqueo en el modelo auditado. El frontend conserva el JWT en `sessionStorage`, sincroniza las pestañas mediante `BroadcastChannel` y restaura la identidad mediante `/api/auth/me`.

Google usa la misma función `createAuthSession`, `AuthContext`, almacenamiento, middleware y permisos. `LoginPage`, `RegisterPage`, `useAuthReturn`, `safeReturnPath` y `getPostLoginRoute` siguen resolviendo el destino original y los borradores de reserva. No se modificaron reservas, pagos ni Stripe.

Decisión de alcance: Google se permite únicamente para CLIENTE. Una cuenta del personal, incluso si estuvo vinculada antes de cambiar de rol, debe usar correo y contraseña. No se asignan roles desde el token, el correo, el dominio ni el cuerpo de la petición.

## Flujo y contrato

1. El frontend habilitado solicita `POST /api/auth/google/challenge`, con JSON `{}` y `X-Google-CSRF: init`.
2. El backend exige un `Origin` exacto de `CORS_ORIGINS`. Devuelve `{ success, statusCode, data: { challengeId, nonce, expiresAt, clientId } }`, sin caché. El desafío dura diez minutos; PostgreSQL conserva solamente el hash del nonce. Los desafíos vencidos se limpian al preparar otro intento.
3. Si los Client ID de ambos lados coinciden, el navegador carga `https://accounts.google.com/gsi/client` y utiliza `google.accounts.id.renderButton`. El popup usa callback JavaScript y el nonce; no hay One Tap ni acceso automático.
4. El callback envía `POST /api/auth/google` con `{ credential, challengeId }` y cabecera `X-Google-CSRF: <nonce>`. El ID token se mantiene solo en memoria mientras se completa el intento.
5. `google-auth-library` verifica la firma con certificados de Google, issuer, audience y tiempo de validez. Se comprueban además nonce, expiración estricta, `azp` cuando existe y `email_verified === true`. Los errores originales de la biblioteca no se registran ni se devuelven, porque pueden contener el token.
6. Un `sub` vinculado identifica al mismo usuario aunque cambie el correo en Google. Su perfil local no se sobrescribe. Un correo nuevo crea solamente un CLIENTE activo con nombre, correo y teléfono nulo.
7. Si el correo ya existe sin vínculo, responde `409 GOOGLE_LINK_REQUIRED`. La interfaz explica la vinculación y solicita la contraseña actual del hotel. El botón «Confirmar contraseña y vincular Google» repite la petición con `password`; el servidor vuelve a verificar el token y bcrypt. No se inicia sesión ni se vincula por mera coincidencia de correo. No se cambia la contraseña existente.
8. Creación/vinculación y consumo del desafío se confirman en una sola transacción con bloqueo de fila. Solo una petición concurrente puede consumirlo. Las restricciones únicas impiden cuentas y vínculos duplicados. Un conflicto devuelve `GOOGLE_RETRY`; un intento nuevo necesita otro desafío/token.
9. El resultado satisfactorio tiene el mismo contrato de `/auth/login`: `{ accessToken, usuario }` dentro de `data`.

CSRF: este flujo es callback + Fetch, sin cookies de autenticación ni recepción de un POST de redirección de Google. Exige origen permitido, JSON, cabecera no simple y nonce vinculado al token y de un solo uso. No depende únicamente de CORS ni acepta formularios externos. No cambiarlo a `login_uri`/redirect sin implementar la validación del `g_csrf_token` en cookie y cuerpo requerida para ese flujo. Véanse la [verificación de Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) y las [cabeceras AJAX y validación del origen de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi).

La interfaz contempla error de script/red, indisponibilidad, contraseña incorrecta, correo no verificado, token/desafío vencido, cuentas inactivas, conflictos y límite de intentos, con mensajes ES/EN. Cerrar el popup no bloquea el formulario ni crea una cuenta: GIS no proporciona a este callback un evento fiable de cancelación del botón; se permite volver a pulsarlo o usar el acceso tradicional. Cancelar la vinculación descarta el token de la memoria y prepara otro desafío.

## Migración

Archivo: `backend/src/migrations/20261028010000-google-identity.js`.

- Crea `google_identities`: `sub` como PK, `usuario_id` único con FK a `usuarios` y fechas. Una cuenta local admite una identidad Google.
- Crea `google_auth_challenges`: UUID, hash de nonce y vencimiento con índice.
- Añade índice único `usuarios_email_normalized_unique` sobre `lower(btrim(email))`. Protege también otros caminos de escritura a usuarios.
- No altera columnas ni contraseñas, no normaliza registros existentes y no ejecuta seeds ni `sync({ force: true })`.
- `up` y `down` son transaccionales, con `lock_timeout` de cinco segundos. Los duplicados hacen fallar `up` sin cambios parciales; deben resolverse manualmente, nunca mediante eliminación automática.
- `down` elimina exclusivamente las dos tablas nuevas y el índice, conservando los usuarios. **Después de usar Google, se pierden los vínculos al ejecutar down**: guardar respaldo y plan de recuperación antes de revertir el esquema. Para desactivar operativamente, poner los flags en `false` y conservar las tablas.

La consulta de prevalidación realizada en `hotel_db` fue de solo lectura: cero grupos duplicados según `lower(btrim(email))`; la tabla de identidades no existe todavía. Esta comprobación debe repetirse antes de migrar. El índice convencional puede bloquear escrituras mientras se crea; planificar la ventana de aplicación.

Las cuentas nuevas creadas por Google reciben un hash bcrypt de un valor aleatorio de alta entropía que se descarta. Así se conserva el contrato `password_hash NOT NULL`, sin inventar una contraseña conocida ni modificar credenciales anteriores. No existe en esta fase un flujo para establecer o recuperar contraseña: esas cuentas dependen de Google. No ejecutar `down` después de utilizarlas sin un plan de recuperación.

## Configuración segura y revisión previa a habilitar

Los archivos `.env` reales no se modificaron. Los ejemplos incluyen:

```dotenv
# Backend
GOOGLE_LOGIN_ENABLED=false
GOOGLE_CLIENT_ID=

# Frontend
VITE_GOOGLE_LOGIN_ENABLED=false
VITE_GOOGLE_CLIENT_ID=
```

El Client ID web es público y debe ser el mismo en ambos lados. Copiarlo de Google Cloud a la configuración local/servidor y al entorno del build, sin incorporarlo al repositorio. Este flujo no necesita `GOOGLE_CLIENT_SECRET`. No enviar tokens de Google por chat ni guardarlos en logs. La configuración rechaza IDs mal formados y flags habilitados sin ID. Los flags ausentes equivalen a desactivado; con ellos apagados no se carga GIS.

Antes de habilitar:

1. Revisar este cambio y los cambios locales previos por separado. Respaldar PostgreSQL y revisar las migraciones pendientes antes de usar `npm --prefix backend run db:migrate`; ese comando aplica todas las pendientes. No ejecutarlo a ciegas en producción.
2. Probar la migración en un entorno de validación y configurar el Client ID real. Habilitar ambos flags solamente allí. Las variables `VITE_*` se incorporan al build, no cambian simplemente al reiniciar Nginx.
3. En el cliente OAuth web, verificar los orígenes JavaScript autorizados: `http://localhost`, `http://localhost:5173` para desarrollo y, cuando se autorice producción, `https://hotel-hunahpu-2026.duckdns.org`. El flujo callback no necesita una URI de redirección backend. Revisar usuarios de prueba y pantalla de consentimiento según el estado del proyecto OAuth. [Configuración oficial](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
4. En backend, `CORS_ORIGINS` debe contener exactamente el origen frontend; no usar comodines. En EC2, verificar `TRUST_PROXY` para que los límites usen la IP real sin confiar en cabeceras arbitrarias.
5. Revisar Nginx/HTTPS: conservar `Origin` y `X-Google-CSRF`, no cachear `/api/auth/google*`, no registrar cuerpos ni Authorization, y mantener fallback de React Router. Si se aplica CSP, permitir los recursos GIS en `script-src`, `frame-src`, `connect-src` y estilos según la guía oficial, sin reemplazar la política completa. Revisar `Cross-Origin-Opener-Policy: same-origin-allow-popups` en las páginas del frontend cuando el popup lo requiera. El Helmet del API no controla las cabeceras del HTML servido por Nginx. No se cambió ninguna configuración desplegada.
6. Completar las pruebas reales enumeradas abajo y la revisión legal. Solo entonces autorizar por separado despliegue/activación. GOOGLE-02 no incluye esa autorización.

## Verificación reproducible y resultados

`npm --prefix backend run verify:google` crea su propio contenedor oficial `postgres:16`, sin volumen persistente, en `127.0.0.1:55433/hotel_test_db`; lo elimina al finalizar. Requiere Docker, la imagen ya disponible y el puerto libre. Si no puede crear el contenedor, aborta; nunca usa `hotel_db` como alternativa. No elimina ni reemplaza pruebas existentes.

Resultados de esta fase:

- TypeScript backend y frontend: correcto.
- Build frontend: correcto; permanece la advertencia de bundle mayor de 500 kB.
- 22 comprobaciones automatizadas con PostgreSQL real, servicios y HTTP real: up/down, rollback por duplicados, conservación de usuarios y hashes, altas CLIENTE, vinculación por contraseña, sub estable, identidades incompatibles, cuentas inactivas/personal, concurrencia y consumo único, rollback del desafío, claims, firma falsificada con certificados actuales de Google, configuración, redacción de logs, login/registro tradicional, `/me`, permisos, CSRF, expiración y rate limiting.
- Las pruebas de reglas de vinculación usan perfiles sintéticos directamente en el servicio. No sustituyen el verificador con mocks y **no acreditan una autenticación satisfactoria con Google**. Los tokens falsificados solo prueban rechazo; la descarga de certificados usa Google real.
- Navegador real: login y registro tradicionales, validación ES/EN, error de credenciales contra backend real, Google oculto por defecto, error Google deshabilitado en login/registro, reintentos, traducción ES/EN y fallo real de conexión al detener la API temporal. Verificado el texto Google en `/privacidad`. La comprobación de Google deshabilitado usó una instancia frontend temporal con un ID sintáctico de prueba; no se usó como credencial real ni se cargó GIS.
- Graphify: backend actualizado; la consulta de actualización del frontend indicó que no había cambios relevantes. La actualización de raíz fue rechazada por la protección contra pérdida de nodos (4492 propuestos frente a 4539 existentes); se conservó el grafo raíz sin forzar su sobrescritura. También informó ausencia del parser SQL opcional. Estas limitaciones del índice no cambian los resultados de TypeScript, build o pruebas.

Pendientes que requieren Client ID real y sesión interactiva de Google: botón oficial renderizado y su anchura móvil, popup/cancelación/bloqueo del popup, alta nueva y retorno a reserva, acceso posterior, contraseña para vincular cuenta existente y acceso tradicional posterior, rechazo real de token de otro cliente/expirado, red durante intercambio, doble clic y reintento después de perder la respuesta. Comprobar Chrome/Safari/móvil y HTTPS/Nginx antes de producción. No se creó una cuenta ni se solicitó consentimiento OAuth al propietario durante esta fase.

## Privacidad y riesgos restantes

Se ajustó `privacidad → proveedores` en `Frontend/src/features/legal/content.es.ts` y `content.en.ts`: comportamiento condicional, identificador Google, correo verificado, nombre, finalidad de autenticación, ausencia de persistencia del token y confirmación de la cuenta existente. El código no solicita contactos, Drive ni acceso a APIs Google adicionales, y no persiste fotografía.

Antes de activar se debe revisar y aprobar ese párrafo en ambos idiomas, concretar responsable/base de tratamiento/proveedor y solicitudes de acceso, rectificación o eliminación, describir los datos técnicos enviados al cargar GIS y ajustar la fecha de publicación. La sección de conservación debe distinguir los desafíos efímeros (diez minutos, limpieza al siguiente intento) de los vínculos persistentes. Esta entrega verifica coherencia funcional; no constituye revisión legal. Las demás afirmaciones legales de GOOGLE-01 no se auditaron nuevamente.

Riesgos heredados o limitaciones: JWT en `sessionStorage` expuesto ante XSS; rate limiting en memoria por proceso (usar protección compartida si se escala); no recuperación de contraseña ni desvinculación autoservicio; el cierre de sesión del hotel no cierra la cuenta de Google; los cambios de seguridad de Google no revocan por sí solos un JWT del hotel ya emitido. El middleware sigue comprobando `activo` y rol en cada petición.

`npm audit` del backend reportó siete vulnerabilidades (cinco moderadas, dos altas) en dependencias ajenas a `google-auth-library`: body-parser, exceljs, fast-uri, qs, sequelize, uuid y zod. No se ejecutó `audit fix` ni se actualizaron esas dependencias dentro de GOOGLE-02. Revisarlas antes del despliegue. Había numerosas pruebas eliminadas y cambios locales previos al iniciar; no se restauraron ni se borraron pruebas durante este trabajo, por lo que no se declara ejecutada la antigua suite completa.

## Archivos de implementación

| Área | Archivos |
| --- | --- |
| Backend Google | `backend/src/routes/googleAuth.routes.ts`, `backend/src/services/googleAuth.service.ts`, `backend/src/services/googleToken.service.ts` |
| Persistencia | `backend/src/migrations/20261028010000-google-identity.js`, `backend/src/models/googleIdentity.js`, `backend/src/models/googleAuthChallenge.js` |
| Integración backend | `backend/src/routes/auth.routes.ts`, `backend/src/services/auth.service.ts`, `backend/src/config/env.ts`, `backend/src/config/httpSecurity.ts`, `backend/src/utils/logger.ts` |
| Dependencia/configuración | `backend/package.json`, `backend/package-lock.json`, `backend/.env.example`, `Frontend/.env.example`, `Frontend/vite.config.ts`, `Frontend/src/app/config/env.ts`, `Frontend/src/vite-env.d.ts` |
| Google UI | `Frontend/src/features/auth/components/GoogleSignIn.tsx`, `Frontend/src/features/auth/googleIdentity.ts`, `Frontend/src/features/auth/googleTexts.ts` |
| Integración frontend | `Frontend/src/features/auth/AuthContext.tsx`, `Frontend/src/features/auth/api/authApi.ts`, `Frontend/src/features/auth/types.ts`, `Frontend/src/features/auth/components/LoginForm.tsx`, `Frontend/src/features/auth/components/RegisterForm.tsx` |
| Privacidad | `Frontend/src/features/legal/content.es.ts`, `Frontend/src/features/legal/content.en.ts` |
| Comprobación y operación | `backend/scripts/verify-google-auth.cjs`, este archivo; índices derivados `graphify-out/`, `Frontend/graphify-out/`, `backend/graphify-out/` |

No se realizó commit, push, merge ni despliegue como parte de esta implementación. La fase se detiene para revisión.
