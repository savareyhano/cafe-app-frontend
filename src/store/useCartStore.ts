import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  tableNumber: string;
  addItem: (item: CartItem) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  updateNote: (menuItemId: string, note: string) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setTableNumber: (table: string) => void;
  totalItems: () => number;
  subtotal: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerName: '',
      customerPhone: '',
      tableNumber: '',
      isCartOpen: false,

      setIsCartOpen: (open) => set({ isCartOpen: open }),

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItemId === item.menuItemId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  updateQuantity: (menuItemId, delta) => {
    set((state) => ({
      items: state.items.map((i) => {
        if (i.menuItemId === menuItemId) {
          const newQuantity = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQuantity };
        }
        return i;
      }),
    }));
  },

  updateNote: (menuItemId, note) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, note } : i
      ),
    }));
  },

  removeItem: (menuItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.menuItemId !== menuItemId),
    }));
  },

  clearCart: () => set({ items: [] }),
  setCustomerName: (customerName) => set({ customerName }),
  setCustomerPhone: (customerPhone) => set({ customerPhone }),
  setTableNumber: (tableNumber) => set({ tableNumber }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}), { name: 'cart-storage' }));
