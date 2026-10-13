# 16 — Docker e infraestructura

`docker-compose.yml` raíz orquesta PostgreSQL 16 y pgAdmin, con puertos 5432 y
5050, volumen `hotel_pg_data` y dependencia pgAdmin → PostgreSQL.
`backend/docker-compose.test.yml` atiende el entorno de pruebas.

Clasificación: `MANTENER_RAIZ` para el compose transversal y
`MANTENER_BACKEND` para el compose de tests. No se rediseñó infraestructura.

Futuro: un Dockerfile frontend, Nginx, TLS y despliegue EC2/RDS/S3 deben
documentarse o implementarse en fases posteriores; no se crean credenciales ni
configuración AWS ficticia en 5G.
