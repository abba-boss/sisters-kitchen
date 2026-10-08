import { motion } from 'framer-motion';

// Base Skeleton Component
export function Skeleton({ className = '', animate = true }) {
  const baseClass = "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded";
  
  if (animate) {
    return (
      <motion.div
        className={`${baseClass} ${className}`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      />
    );
  }
  
  return <div className={`${baseClass} ${className} animate-pulse`} />;
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full h-48" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        
        {/* Vendor */}
        <Skeleton className="h-3 w-1/2" />
        
        {/* Price & Rating */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

// List Skeleton (for any list)
export function ListSkeleton({ count = 3, type = 'card' }) {
  const items = Array.from({ length: count }, (_, i) => i);
  
  if (type === 'product') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }
  
  if (type === 'order') {
    return (
      <div className="space-y-4">
        {items.map((i) => <OrderCardSkeleton key={i} />)}
      </div>
    );
  }
  
  // Generic card list
  return (
    <div className="space-y-4">
      {items.map((i) => (
        <div key={i} className="card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-4 h-4" />
      </div>
      <Skeleton className="h-6 w-24 mb-1" />
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

// Page Skeleton (full page loading)
export function PageSkeleton() {
  return (
    <div className="page-container py-10 space-y-6">
      {/* Title */}
      <Skeleton className="h-8 w-64" />
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)}
      </div>
      
      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// Inline Skeleton (for small elements)
export function InlineSkeleton({ width = 'w-20', height = 'h-4' }) {
  return <Skeleton className={`inline-block ${width} ${height}`} />;
}

export default Skeleton;
