import { motion } from 'framer-motion';

// ─── Individual skeletons ──────────────────────────────────────

export function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 rounded-none" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-3/5 rounded-full" />
        <div className="flex justify-between items-center pt-1">
          <div className="skeleton h-5 w-1/4 rounded-full" />
          <div className="skeleton h-4 w-1/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function VendorSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-36 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="skeleton w-14 h-14 rounded-2xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-4 w-3/4 rounded-full" />
            <div className="skeleton h-3 w-1/2 rounded-full" />
          </div>
        </div>
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-2/3 rounded-full" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-1/4 rounded-full" />
          <div className="skeleton h-3 w-1/4 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/3 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
      </div>
      <div className="space-y-1 text-right">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-4 w-16 rounded-full ml-auto" />
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"
        />
        <p className="text-brand-muted font-medium text-sm">Loading…</p>
      </div>
    </div>
  );
}

export function ContentLoader({ rows = 3 }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-4 rounded-full" style={{ width: `${70 + Math.random() * 30}%` }} />
          <div className="skeleton h-3 rounded-full" style={{ width: `${40 + Math.random() * 40}%` }} />
        </div>
      ))}
    </div>
  );
}

// ─── Grid helpers ──────────────────────────────────────────────

export function GridSkeleton({ count = 8, Component = ProductSkeleton }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => <Component key={i} />)}
    </div>
  );
}

export function VendorGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <VendorSkeleton key={i} />)}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton h-7 w-1/2 rounded-full" />
          <div className="skeleton h-3 w-3/4 rounded-full" />
        </div>
      ))}
    </div>
  );
}
