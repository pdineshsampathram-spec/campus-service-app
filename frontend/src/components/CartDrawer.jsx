import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    setPlacing(true);
    try {
      const canteen = cartItems[0]?.canteen || 'Main Canteen';
      await orderService.createOrder({
        items: cartItems,
        canteen,
        total_amount: totalAmount,
        special_instructions: '',
      });
      clearCart();
      setIsCartOpen(false);
      toast.success('Order placed successfully! 🎉', { duration: 4000 });
    } catch (err) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-indigo-600" />
                <h2 className="font-grotesk font-semibold text-slate-800 dark:text-white">Your Cart</h2>
                {cartItems.length > 0 && (
                  <span className="badge bg-indigo-100 text-indigo-600">{cartItems.length} items</span>
                )}
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">Your cart is empty</p>
                  <p className="text-slate-400 text-sm mt-1">Add items from the food menu</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <motion.div
                    key={item.item_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                      {item.emoji || '🍽️'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-indigo-100 transition-colors">
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-bold text-slate-800 dark:text-white w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-indigo-100 transition-colors">
                        <Plus size={10} />
                      </button>
                      <button onClick={() => removeFromCart(item.item_id)}
                        className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors ml-1">
                        <Trash2 size={10} className="text-red-500" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total</span>
                  <span className="font-grotesk font-bold text-lg text-slate-800 dark:text-white">₹{totalAmount.toFixed(2)}</span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {placing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Place Order · ₹{totalAmount.toFixed(2)}</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
