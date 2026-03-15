import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Clock, Flame, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { foodService } from '../services/api';
import useDebounce from '../hooks/useDebounce';

const CanteenCard = memo(({ canteen, isSelected, onSelect }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(canteen)}
    className={`p-4 rounded-2xl border-2 text-left transition-all ${
      isSelected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
        : 'border-slate-200 dark:border-slate-700 glass-card hover:border-indigo-300'
    }`}
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${canteen.color} flex items-center justify-center text-2xl mb-3 shadow-md`}>
      {canteen.emoji}
    </div>
    <h3 className="font-semibold text-slate-800 dark:text-white">{canteen.name}</h3>
    <div className="flex items-center gap-3 mt-1">
      <span className="flex items-center gap-1 text-xs text-amber-500">
        <Star size={11} fill="currentColor" /> {canteen.rating}
      </span>
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <Clock size={11} /> {canteen.time}
      </span>
    </div>
  </motion.button>
));

const MenuItem = memo(({ item, canteenName, onAdd }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-card p-4 flex items-center gap-4 group hover:shadow-xl transition-all"
  >
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-3xl flex-shrink-0">
      {item.emoji}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{item.name}</p>
        {item.popular && <Flame size={12} className="text-orange-400 flex-shrink-0" />}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">₹{item.price}</p>
    </div>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onAdd({ ...item, canteen: canteenName })}
      className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 flex-shrink-0"
    >
      <ShoppingCart size={14} />
    </motion.button>
  </motion.div>
));

import SkeletonLoader from '../components/common/SkeletonLoader';

export default function FoodOrdering() {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const { data } = await foodService.getCanteens();
        setCanteens(data);
        if (data.length > 0) setSelectedCanteen(data[0]);
      } catch (err) {
        console.error('Failed to fetch canteens', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCanteens();
  }, []);

  const categories = useMemo(() => {
    if (!selectedCanteen) return ['All'];
    return ['All', ...new Set(selectedCanteen.items.map(i => i.category))];
  }, [selectedCanteen]);

  const filteredItems = useMemo(() => {
    if (!selectedCanteen) return [];
    return selectedCanteen.items.filter(item =>
      (selectedCategory === 'All' || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [selectedCanteen, selectedCategory, debouncedSearch]);

  const handleCanteenSelect = useCallback((canteen) => {
    setSelectedCanteen(canteen);
    setSelectedCategory('All');
  }, []);

  const handleCategorySelect = useCallback((cat) => {
    setSelectedCategory(cat);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonLoader variant="card" count={3} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader variant="card" count={6} />
        </div>
      </div>
    );
  }

  if (!selectedCanteen) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title">Food Ordering</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Order from any campus canteen</p>
      </div>

      {/* Canteen selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canteens.map(canteen => (
          <CanteenCard
            key={canteen.id || canteen._id}
            canteen={canteen}
            isSelected={selectedCanteen?._id === canteen._id}
            onSelect={handleCanteenSelect}
          />
        ))}
      </div>

      {/* Search + Categories */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={handleSearchChange}
            className="input-field pl-9 py-2.5"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div>
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{selectedCanteen.name} Menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MenuItem
              key={item.item_id}
              item={item}
              canteenName={selectedCanteen.name}
              onAdd={addToCart}
            />
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-medium">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}
