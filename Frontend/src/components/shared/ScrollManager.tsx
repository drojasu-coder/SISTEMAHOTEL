import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Al cambiar de ruta lleva la vista al inicio; con ancla (#id) se desplaza al
 * elemento. Retroceder/avanzar (POP) y los cambios solo de query string no
 * alteran el desplazamiento.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const frame = requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView();
        else if (navigationType !== 'POP') window.scrollTo({ top: 0 });
      });
      return () => cancelAnimationFrame(frame);
    }
    if (navigationType !== 'POP') window.scrollTo({ top: 0 });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash]);

  return null;
}
