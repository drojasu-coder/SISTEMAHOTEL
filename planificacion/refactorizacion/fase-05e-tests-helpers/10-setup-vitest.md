# Setup de Vitest

Vitest usa ambiente Node, `tests/setup.ts`, globals, reporter por defecto e
incluye `tests/**/*.test.ts`.

El setup global sólo configura variables sintéticas de test. No registra mocks
globales ni depende del orden de suites. Las conexiones PostgreSQL se crean y
cierran por suite.

No se modificó `vitest.config.ts` ni se introdujo estado global adicional.
