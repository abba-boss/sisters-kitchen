import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  actionLabel,
  actionTo,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="state-panel border-red-100 bg-red-50/40 text-center max-w-lg mx-auto"
    >
      <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] bg-red-100 rounded-[1.4rem] flex items-center justify-center mx-auto mb-5">
        <AlertTriangle size={30} className="text-red-500" aria-hidden="true" />
      </div>
      <h3 className="font-poppins font-semibold text-xl text-brand-dark mb-2">{title}</h3>
      <p className="text-brand-muted max-w-md mx-auto mb-6 text-sm leading-relaxed">{message}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={16} aria-hidden="true" />
            {retryLabel}
          </button>
        )}
        {actionLabel && actionTo && (
          <Link to={actionTo} className="btn-secondary inline-flex">
            {actionLabel}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
