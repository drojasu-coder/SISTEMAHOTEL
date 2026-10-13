# Hallazgos y defectos

No se reprodujo un defecto funcional durante la fase. La suite baseline pasó antes de añadir pruebas.

Hallazgos de evidencia:

- Hay 184 operaciones efectivas, pero no 184 pruebas HTTP específicas.
- Las pruebas de un módulo no prueban automáticamente todas sus operaciones.
- Muchos paths multilinea requieren revisión manual para completar la URL exacta en el CSV.
- Los service/model associations no se resolvieron cuando el parser no podía demostrar la relación.
- El mensaje de José sobre 17 de 36 endpoints no contiene una lista endpoint por endpoint ni evidencia de pruebas.

Estos son límites de trazabilidad, no correcciones funcionales. No se cambió código productivo.
