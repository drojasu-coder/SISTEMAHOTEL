# Brechas y riesgos

1. Faltan pruebas PostgreSQL específicas para amenidades, eventos, servicios de eventos, parqueos, spa y transporte.
2. La atomicidad no es uniforme en los dominios con SELECT + INSERT.
3. Los contratos temporales mezclan fechas de calendario, horas locales e instantes con offset.
4. La política de estados y terminalidad varía por dominio.
5. La autorización de ownership está en services sólo para algunos dominios y en routers para otros.
6. No hay evidencia de constraints PostgreSQL que sustituyan todas las comprobaciones de disponibilidad.
7. No debe usarse la cobertura global para declarar seguros endpoints sin prueba específica.

Prioridad: primero concurrencia de recursos compartidos; después fechas/zonas horarias; luego matriz de estados y permisos.
