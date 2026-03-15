import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Sun, Moon, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const notifications = [
  { id: 1, text: 'Your certificate request has been approved', time: '2m ago', color: 'bg-emerald-500' },
  { id: 2, text: 'Exam reminder: DSA tomorrow at 9 AM', time: '1h ago', color: 'bg-indigo-500' },
  { id: 3, text: 'Library seat confirmed for today', time: '3h ago', color: 'bg-sky-500' },
  { id: 4, text: 'Complaint CMP-001234 is in progress', time: '1d ago', color: 'bg-amber-500' },
];

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search services, orders..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 dark:text-slate-300 placeholder-slate-400"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-4">
        {/* Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ShoppingCart size={18} className="text-slate-600 dark:text-slate-300" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={18} className="text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Notifications</p>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                    <div className={`w-2 h-2 ${n.color} rounded-full mt-1.5 flex-shrink-0`} />
                    <div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
              {user?.name?.split(' ')[0] || 'Student'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50"
              >
                <button onClick={() => { navigate('/profile'); setShowProfile(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <User size={14} /> Profile
                </button>
                <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <Settings size={14} /> Settings
                </button>
                <hr className="my-1 border-slate-100 dark:border-slate-700" />
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut size={14} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
