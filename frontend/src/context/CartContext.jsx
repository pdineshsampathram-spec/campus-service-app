import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = useCallback((item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.item_id === item.item_id);
      if (existing) {
        return prev.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart!`, { icon: '🛒' });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prev => prev.filter(i => i.item_id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev => prev.map(i => i.item_id === itemId ? { ...i, quantity } : i));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCartItems([]), []);

  const totalAmount = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const contextValue = useMemo(() => ({
    cartItems, isCartOpen, setIsCartOpen,
    addToCart, removeFromCart, updateQuantity, clearCart,
    totalAmount, totalItems
  }), [cartItems, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
