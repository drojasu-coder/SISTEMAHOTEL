import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useAdminSedes, type AdminSede } from './hooks/useAdminSedes';

interface AdminScopeContextValue {
  selectedSedeId: number | 'all';
  setSelectedSedeId: (id: number | 'all') => void;
  sedes: AdminSede[];
  selectedSede?: AdminSede;
  isLoadingSedes: boolean;
  isErrorSedes: boolean;
  isGlobalScope: boolean;
  refetchSedes: () => void;
}
const AdminScopeContext = createContext<AdminScopeContextValue>({
  selectedSedeId: 'all', setSelectedSedeId: () => {}, sedes: [],
  isLoadingSedes: false, isErrorSedes: false, isGlobalScope: false, refetchSedes: () => {},
});
const STORAGE_KEY = 'hunahpu.admin.scope.sede.v1';

function ScopeState({ userId, children }: { userId?: number; children: React.ReactNode }) {
  const query = useAdminSedes();
  const sedes = query.data?.sedes ?? [];
  const storageKey = STORAGE_KEY + ':' + (userId ?? 'anonymous');
  const [selectedSedeId, setSelected] = useState<number | 'all'>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      const value = Number(saved);
      return saved !== null && Number.isSafeInteger(value) && value > 0 ? value : 'all';
    } catch { return 'all'; }
  });
  const setSelectedSedeId = (id: number | 'all') => {
    if (id === 'all' && query.data?.global === false) return;
    if (id !== 'all' && !sedes.some(site => site.id === id)) return;
    setSelected(id);
    try { sessionStorage.setItem(storageKey, String(id)); } catch { /* Visual preference can stay in memory. */ }
  };
  useEffect(() => {
    if (query.isSuccess && !query.data?.global && (selectedSedeId === 'all' || !sedes.some(site => site.id === selectedSedeId))) {
      if (sedes[0]) setSelectedSedeId(sedes[0].id);
      return;
    }
    if (query.isSuccess && selectedSedeId !== 'all' && !sedes.some(site => site.id === selectedSedeId)) {
      setSelectedSedeId('all');
    }
  }, [query.data, query.isSuccess, selectedSedeId]);
  return <AdminScopeContext.Provider value={{
    selectedSedeId, setSelectedSedeId, sedes,
    selectedSede: typeof selectedSedeId === 'number' ? sedes.find(site => site.id === selectedSedeId) : undefined,
    isLoadingSedes: query.isLoading, isErrorSedes: query.isError,
    isGlobalScope: query.data?.global ?? false, refetchSedes: () => { void query.refetch(); },
  }}>{children}</AdminScopeContext.Provider>;
}
export const AdminScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return <ScopeState key={user?.id ?? 'anonymous'} userId={user?.id}>{children}</ScopeState>;
};
export const useAdminScope = () => useContext(AdminScopeContext);
