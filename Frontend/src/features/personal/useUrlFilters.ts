import { useSearchParams } from 'react-router-dom';

/** Filtros del módulo en la URL: se conservan al abrir un formulario, recargar o volver desde otra sección. */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    if (!('pagina' in changes)) next.delete('pagina');
    setParams(next, { replace: true });
  };
  return { params, update, setParams };
}
