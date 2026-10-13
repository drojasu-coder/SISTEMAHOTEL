# Fase 1D — Alternativas evaluadas

## A. Bloqueo de la habitación en transacción

Bloquea la fila `habitaciones` con `FOR UPDATE`, consulta disponibilidad e inserta
dentro de la misma transacción. No requiere migración ni cambios de contrato.

## B. Restricción PostgreSQL de exclusión

Sería una garantía fuerte, pero requiere nueva migración, tipos/rangos y una expresión
condicional para excluir estados cancelados/finalizados/expirados. No se autorizó
crear ni ejecutar migraciones en esta fase.

## C. Combinación

Es la opción más robusta a largo plazo, pero excede el cambio mínimo autorizado.

Se seleccionó A como corrección controlada y reversible.
