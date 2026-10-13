# 15 — `script.sql`

`script.sql` es un archivo SQL grande, tracked y modificado localmente. Puede
tener valor de bootstrap o académico, pero su contenido no se auditó ni se
alteró para evitar perder cambios del usuario.

Clasificación: `PROTEGIDO_NO_TOCAR`, `REQUIERE_CONFIRMACION`. No moverlo mientras
exista la modificación local; cualquier ubicación final requiere comparar
contra el esquema/migraciones y aprobación humana.
