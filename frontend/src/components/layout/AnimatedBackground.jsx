import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30" />

      {/* Blob 1 - Indigo */}
      <motion.div
        className="blob blob-1 absolute top-0 -left-4 w-96 h-96 bg-indigo-400"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Blob 2 - Sky */}
      <motion.div
        className="blob blob-2 absolute top-0 right-0 w-80 h-80 bg-sky-400"
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Blob 3 - Emerald */}
      <motion.div
        className="blob blob-3 absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400"
        animate={{
          x: [0, 20, -30, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Blob 4 - Purple */}
      <motion.div
        className="blob blob-1 absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-400"
        animate={{
          x: [0, -20, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/20 dark:from-slate-950/80 dark:via-transparent dark:to-slate-950/20" />
      
      {/* Dot pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.07,
      }} />
    </div>
  );
}
