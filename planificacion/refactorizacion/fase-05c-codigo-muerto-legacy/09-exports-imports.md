# Exports e imports

Se revisaron reexports legacy, imports de módulos piloto y consumidores de
helpers. No se identificó un import no usado que pudiera limpiarse de forma
inequívoca sin una campaña de formatting o cambio de contrato.

El export `getIvaValue` tiene consumidor productivo en facturación. Los
reexports de controllers, services y routers están cubiertos por la prueba
arquitectónica.
