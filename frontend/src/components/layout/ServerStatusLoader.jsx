import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Server } from 'lucide-react';

export default function ServerStatusLoader() {
  const [isWaking, setIsWaking] = useState(false);

  useEffect(() => {
    const handleServerStatus = (e) => {
      setIsWaking(e.detail);
    };

    window.addEventListener('server-waking', handleServerStatus);
    return () => window.removeEventListener('server-waking', handleServerStatus);
  }, []);

  return (
    <AnimatePresence>
      {isWaking && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800"
        >
          <div className="relative">
             <Server size={18} className="text-indigo-400" />
             <Loader2 size={10} className="absolute -top-1 -right-1 animate-spin text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">Starting backend server… please wait.</span>
            <span className="text-[10px] opacity-60">This may take 30-50 seconds on Render</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
