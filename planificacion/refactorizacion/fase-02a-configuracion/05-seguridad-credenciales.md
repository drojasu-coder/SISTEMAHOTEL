# Seguridad y proteccion de credenciales

Se eliminaron usuario, contrasena, host y base concretos de `config.json`.
La configuracion versionada solo referencia nombres de variables.

`.gitignore` ya excluye `.env`; no debe usarse para ocultar credenciales que se
hayan incorporado al historial. Si una clave real aparece en Git, debe rotarse
sin imprimir su valor ni reescribir el historial automaticamente.

Stripe valida prefijos de claves (`sk_test_`/`sk_live_`) y exige el par de
credenciales cuando la integracion se habilita.
