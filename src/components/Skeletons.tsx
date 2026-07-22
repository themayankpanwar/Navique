import { motion } from 'framer-motion';

// Loading skeleton blocks used while streaming / fetching.
export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-7 w-2/3" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
      </div>
    </div>
  );
}

export function ItinerarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-6 space-y-3">
        <div className="skeleton h-8 w-1/2" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-4/5" />
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="glass-card p-6 space-y-3"
        >
          <div className="skeleton h-6 w-1/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-3/4" />
        </motion.div>
      ))}
    </div>
  );
}

export function WeatherSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-6 w-1/2" />
      <div className="flex items-center gap-4">
        <div className="skeleton h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-6 w-24" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-16" />
        <div className="skeleton h-16" />
        <div className="skeleton h-16" />
      </div>
    </div>
  );
}

export function TripListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-20 w-full" />
          <div className="flex gap-2 pt-2">
            <div className="skeleton h-8 w-20" />
            <div className="skeleton h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
