# Baseline Git y entorno

| Elemento | Resultado |
|---|---|
| Rama | `refactor/backend-architecture` |
| HEAD | `9df3a301401f388fdbddfe190d042a8a9fe430f9` |
| Referencia José | `origin/hardening/backend-final` en `83d08272c8c943f2639c9d8fca3b68c3559c443e` |
| Merge-base | `83d08272c8c943f2639c9d8fca3b68c3559c443e` |
| Commits HEAD por delante de José | `9df3a30`, `f5ae3d2`, `7deafd2`, `e7bc4e5`, `e1b1be4` y anteriores de la línea compartida |
| Commits José por delante | ninguno en la referencia local |
| Baseline de pruebas | 65: 37 unitarias, 28 integración |
| Migraciones encontradas | 41 en `backend/src/migrations` |

El worktree ya contenía cambios locales protegidos y el ZIP de Fase 4D.
No se alteraron. José continúa pausado y `9df3a30` no es su base futura
definitiva.
