# Grafo y ciclos

Se ejecutó un analizador temporal sobre todos los `.ts` bajo `backend/src`. Reconoció `from`, `import()` y `require()` con especificadores relativos, resolvió `.ts` e `index.ts` y calculó componentes fuertemente conectados.

Resultado: 180 archivos, 432 aristas y cero componentes con más de un nodo. La prueba reproducible `tests/unit/architecture.test.ts` repite el análisis y falla si aparece un ciclo relativo.

Limitaciones: no se resuelven aliases, paquetes externos, extensiones alternativas, cargas calculadas ni efectos de inicialización. Debe repetirse una revisión dinámica si se incorporan esos mecanismos.
