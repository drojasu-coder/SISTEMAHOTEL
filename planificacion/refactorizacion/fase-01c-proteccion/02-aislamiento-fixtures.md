# Fase 1C — Aislamiento y limpieza de fixtures

La revisión detectó persistencia entre ejecuciones: los tests anteriores cerraban la
conexión, pero no borraban sus registros. Se corrigió sólo la infraestructura de
pruebas:

- auth elimina el usuario generado;
- pagos elimina pago, carrito y usuarios generados;
- reservas elimina reservas y recursos creados por IDs propios.

No se usa truncamiento global ni `clearTestTables`, porque podría afectar datos ajenos.
La limpieza está limitada a identificadores generados durante cada archivo. Los
fixtures históricos que ya existían antes de esta fase no se eliminan.
