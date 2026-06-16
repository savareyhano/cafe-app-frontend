import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrderStore {
  activeOrderIds: string[];
  addOrderId: (id: string) => void;
  removeOrderId: (id: string) => void;
  clearAllOrders: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      activeOrderIds: [],
      addOrderId: (id) =>
        set((state) => ({
          activeOrderIds: state.activeOrderIds.includes(id)
            ? state.activeOrderIds
            : [...state.activeOrderIds, id],
        })),
      removeOrderId: (id) =>
        set((state) => ({
          activeOrderIds: state.activeOrderIds.filter((orderId) => orderId !== id),
        })),
      clearAllOrders: () => set({ activeOrderIds: [] }),
    }),
    {
      name: 'mirasa-active-orders',
    }
  )
);
