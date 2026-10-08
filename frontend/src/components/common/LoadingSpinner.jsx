import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Spinning loader
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2 
      className={`animate-spin text-primary ${sizeClasses[size]} ${className}`}
    />
  );
}

// Full page loader
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-brand-muted text-sm">{message}</p>
      </div>
    </div>
  );
}

// Inline loader (for buttons, etc.)
export function InlineLoader({ message }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      {message && <span>{message}</span>}
    </div>
  );
}

// Card loader
export function CardLoader({ message = 'Loading...' }) {
  return (
    <div className="card p-8 text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-3" />
      <p className="text-sm text-brand-muted">{message}</p>
    </div>
  );
}

// Dots loader
export function DotsLoader() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// Pulse loader (for avatars, images)
export function PulseLoader({ className = '' }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`bg-gray-200 ${className}`}
    />
  );
}

// Progress bar loader
export function ProgressLoader({ progress = 0, message }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-brand-muted">{message}</span>
        <span className="text-sm font-semibold text-brand-dark">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// Overlay loader (for forms, modals)
export function OverlayLoader({ message = 'Processing...' }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-3" />
        <p className="text-sm text-brand-dark font-medium">{message}</p>
      </div>
    </div>
  );
}

// Button loading state
export function ButtonLoader() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span>Loading...</span>
    </div>
  );
}

export default LoadingSpinner;
