import { create } from "zustand";

export type CartProduct = {
  id: number;
  name: string;
  price: string;
  color: string;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (product: CartProduct) => void;
  remove: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  items: [],
  add: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    }),
  remove: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),
  setQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i,
            ),
    })),
  clear: () => set({ items: [] }),
}));

export function cartTotal(items: CartItem[]): number {
  return items.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0,
  );
}
