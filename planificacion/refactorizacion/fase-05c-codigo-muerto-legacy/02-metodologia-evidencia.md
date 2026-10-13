# Metodología y evidencia

Cada candidato se contrastó contra imports estáticos, reexports, entrypoint
`src/app.ts`, tests, Swagger y usos internos. No se concluyó muerte por una
búsqueda aislada del nombre.

Regla aplicada: sólo se elimina `MUERTO_DEMOSTRADO`. Un export público,
adapter de ruta o fachada con consumidor de compatibilidad se conserva aunque
su implementación sea pequeña.

No se tocaron modelos, migraciones, tests, dependencias ni configuración fuera
del alcance.
