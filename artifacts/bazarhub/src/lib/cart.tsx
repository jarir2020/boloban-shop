import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '@workspace/api-client-react';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('bazarhub-cart');
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bazarhub-cart', JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    addItem: (product, quantity = 1) => setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) => item.product.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, Math.max(product.stock, 1)) }
          : item);
      }
      return [...current, { product, quantity: Math.min(quantity, Math.max(product.stock, 1)) }];
    }),
    updateQuantity: (productId, quantity) => setItems((current) => quantity < 1
      ? current.filter((item) => item.product.id !== productId)
      : current.map((item) => item.product.id === productId
        ? { ...item, quantity: Math.min(quantity, Math.max(item.product.stock, 1)) }
        : item)),
    removeItem: (productId) => setItems((current) => current.filter((item) => item.product.id !== productId)),
    clearCart: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}