# Guía de Arranque y Separación de Entornos

Este documento describe la configuración y los comandos para iniciar los servicios del sistema, diferenciando el entorno de desarrollo habitual del entorno de pruebas manuales y suites automatizadas.

---

## 1. Bases de Datos Disponibles en Docker

| Base de datos | Contenedor | Puerto Host (Externo) | Puerto PostgreSQL (Interno) | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| `hotel_db` | `hotel_postgres` | `5432` | `5432` | Desarrollo habitual del sistema. |
| `hotel_test_db` | `hotel_postgres_test` | `55432` | `5432` | Pruebas manuales e interactivas (`dev:test`). |
| `hotel_test_db` (aislada) | `hotel_postgres_test` | `55433` | `5432` | Suites automatizadas que limpian o reinician datos. |

---

## 2. Comandos de Arranque

### A. Backend (`/backend`)

1. **Desarrollo Habitual (Base principal `hotel_db:5432`):**
   ```bash
   npm run dev
   ```
   - Establece `NODE_ENV=development`.
   - Consume `DATABASE_URL` conectando a `hotel_db` en el puerto `5432`.
   - Si `DATABASE_URL` apunta por error a `hotel_test_db` o puerto `55432`, el arranque falla de inmediato con un mensaje descriptivo para evitar contaminaciones.

2. **Pruebas Manuales (Base de pruebas `hotel_test_db:55432`):**
   ```bash
   npm run dev:test
   ```
   - Establece `NODE_ENV=test`.
   - Consume `TEST_DATABASE_URL` conectando a `hotel_test_db` en el puerto `55432`.
   - Si `TEST_DATABASE_URL` apunta por error a `hotel_db` o puerto `5432`, el arranque falla con mensaje de error.

3. **Suites de Pruebas Automatizadas:**
   ```bash
   npm test
   # o pruebas focalizadas:
   npm run test:unit
   npm run test:integration
   ```
   - Utilizan la base de pruebas aislada sin interferir con la base habitual ni borrar datos de desarrollo.

### B. Frontend (`/Frontend`)

```bash
npm run dev
```
- Inicia el servidor Vite en `http://localhost:5173`.
- Consume `VITE_API_BASE_URL` (por defecto `http://localhost:4000/api`).

---

## 3. Resumen en Consola al Iniciar el Backend

Al arrancar, el backend realiza una consulta real (`SELECT current_database(), inet_server_port();`) y muestra un resumen con los puertos distinguidos:

```text
════════════════════════════════════════════════════════════
 HOTEL HUNAPÚ - Backend Server
════════════════════════════════════════════════════════════
 Entorno:             development
 Puerto HTTP:         4000
 Host configurado:    127.0.0.1
 Puerto externo:      5432 (Host / Docker port)
 Puerto interno DB:   5432 (PostgreSQL server port)
 Base confirmada:     hotel_db
 Estado conexión:     Satisfactoria
════════════════════════════════════════════════════════════
```

No se imprimen contraseñas, tokens ni credenciales sensibles.
