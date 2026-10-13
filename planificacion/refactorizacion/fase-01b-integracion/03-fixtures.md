# Fase 1B — Fixtures reproducibles

Los fixtures se crean sólo en PostgreSQL aislado y se cierran con la instancia de
Sequelize al terminar cada archivo de integración. Se utilizaron usuarios, mesas,
habitaciones, parqueos, actividades, recursos e instructores según las columnas
requeridas por los modelos actuales.

Los identificadores y correos se generan con sufijos temporales para evitar colisiones
entre ejecuciones. No se cargaron datos de desarrollo ni producción. La primera
ejecución detectó que `Mesa.zona` era obligatorio; se corrigió únicamente el fixture
de prueba.

Pendiente para una cobertura completa: fixtures dedicados de amenidades, carritos con
artículos, reembolsos y eventos Stripe persistidos.
