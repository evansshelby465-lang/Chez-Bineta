import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'chez_bineta_current_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        // Enforce strict price check even on restored cart: Fataya MUST be 100 FCFA
        return parsed.map(item => {
          if (item.productId === 'fataya') {
            return { ...item, price: 100, lineTotal: 100 * item.quantity };
          }
          return { ...item, lineTotal: item.price * item.quantity };
        });
      }
    } catch {
      // Ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  const addItem = (product: Product, quantity = 1, variant?: string) => {
    const verifiedPrice = product.id === 'fataya' ? 100 : product.price;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product.id && i.variant === variant
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          price: verifiedPrice,
          lineTotal: verifiedPrice * newQty,
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: verifiedPrice,
          quantity,
          variant,
          imageUrl: product.imageUrl,
          lineTotal: verifiedPrice * quantity,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variant);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variant === variant) {
          const verifiedPrice = i.productId === 'fataya' ? 100 : i.price;
          return {
            ...i,
            quantity,
            price: verifiedPrice,
            lineTotal: verifiedPrice * quantity,
          };
        }
        return i;
      })
    );
  };

  const removeItem = (productId: string, variant?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variant === variant))
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.lineTotal, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
