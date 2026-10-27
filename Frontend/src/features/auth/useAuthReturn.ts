import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { safeReturnPath } from './secureReturn';
import { restoreRoomDraft, saveRoomDraft, validatedRoomDraft } from './reservationDraft';

export function useAuthReturn() {
  const { state } = useLocation();
  const context = useMemo(() => {
    const hasFrom = state && typeof state === 'object' && 'from' in state;
    const from = hasFrom ? safeReturnPath(state.from) : restoreRoomDraft();
    return { from, draft: validatedRoomDraft(from) };
  }, [state]);
  useEffect(() => {
    if (context.from?.startsWith('/habitaciones')) saveRoomDraft(context.from);
  }, [context.from]);
  return { ...context, state: { from: context.from } };
}
