import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import type { Carrito, CarritoItem, TipoItem } from "../lib/types";
import { useAuth } from "./AuthContext";

interface CartState {
  carrito: Carrito | null;
  items: CarritoItem[];
  total: number;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Agrega una reserva ya creada al carrito (crea el carrito si hace falta). */
  addItem: (tipo_item: TipoItem, referencia_id: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
}

const Ctx = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const esCliente = user?.rol === "cliente";

  const loadItems = useCallback(async (c: Carrito) => {
    const r = await api.get<{ items: CarritoItem[]; total: number }>(`/carritos/${c.id}/items`);
    setItems(r.items ?? []);
    setTotal(Number(r.total ?? 0));
  }, []);

  const refresh = useCallback(async () => {
    if (!esCliente) { setCarrito(null); setItems([]); setTotal(0); return; }
    setLoading(true);
    try {
      const c = await api.get<Carrito>("/carritos/actual");
      setCarrito(c);
      await loadItems(c);
    } catch (e) {
      if (e instanceof ApiError && e.code === "ACTIVE_CART_NOT_FOUND") {
        setCarrito(null); setItems([]); setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [esCliente, loadItems]);

  useEffect(() => { refresh(); }, [refresh]);

  const ensureCart = useCallback(async (): Promise<Carrito> => {
    if (carrito) return carrito;
    try {
      const c = await api.post<Carrito>("/carritos");
      setCarrito(c);
      return c;
    } catch (e) {
      // Ya existía uno activo que aún no habíamos cargado.
      if (e instanceof ApiError && e.code === "CART_ALREADY_ACTIVE") {
        const c = await api.get<Carrito>("/carritos/actual");
        setCarrito(c);
        return c;
      }
      throw e;
    }
  }, [carrito]);

  const addItem = useCallback(async (tipo_item: TipoItem, referencia_id: number) => {
    const c = await ensureCart();
    await api.post(`/carritos/${c.id}/items`, { tipo_item, referencia_id });
    await loadItems(c);
  }, [ensureCart, loadItems]);

  const removeItem = useCallback(async (itemId: number) => {
    if (!carrito) return;
    await api.delete(`/carritos/${carrito.id}/items/${itemId}`);
    await loadItems(carrito);
  }, [carrito, loadItems]);

  const value = useMemo(
    () => ({ carrito, items, total, loading, refresh, addItem, removeItem }),
    [carrito, items, total, loading, refresh, addItem, removeItem],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart debe usarse dentro de CartProvider");
  return c;
};
