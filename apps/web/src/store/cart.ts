import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartLine = {
  type: 'product' | 'combo';
  id: string;
  name: string;
  price: number;
  qty: number;
  unit?: string;
};

type CartState = {
  items: CartLine[];
  add: (item: Omit<CartLine, 'qty'>, qty?: number) => void;
  remove: (type: string, id: string) => void;
  setQty: (type: string, id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => {
        const items = [...get().items];
        const key = `${item.type}-${item.id}`;
        const idx = items.findIndex((i) => `${i.type}-${i.id}` === key);
        if (idx >= 0) items[idx].qty += qty;
        else items.push({ ...item, qty });
        set({ items });
      },
      remove: (type, id) =>
        set({ items: get().items.filter((i) => !(i.type === type && i.id === id)) }),
      setQty: (type, id, qty) =>
        set({
          items:
            qty <= 0
              ? get().items.filter((i) => !(i.type === type && i.id === id))
              : get().items.map((i) =>
                  i.type === type && i.id === id ? { ...i, qty } : i,
                ),
        }),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((a, i) => a + i.price * i.qty, 0),
      count: () => get().items.reduce((a, i) => a + i.qty, 0),
    }),
    { name: 'pomar-fresh-cart' },
  ),
);
