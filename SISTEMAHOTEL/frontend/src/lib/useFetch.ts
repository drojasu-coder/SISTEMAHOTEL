import { DependencyList, useCallback, useEffect, useState } from "react";
import { errorMessage } from "./api";

/** Carga datos al montar (o cuando cambian las dependencias) y expone loading/error/reload. */
export function useFetch<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    return fn()
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { data, loading, error, reload: run };
}
