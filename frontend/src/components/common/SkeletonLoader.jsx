import { motion } from 'framer-motion';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
);

export default function SkeletonLoader({ variant = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <>
        {items.map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="w-16 h-4 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-3 text-center">
            <Skeleton className="w-12 h-12 rounded-full mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return <Skeleton className="w-full h-8" />;
}
