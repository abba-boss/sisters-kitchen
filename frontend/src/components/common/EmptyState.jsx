import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  compact = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className={
        compact
          ? 'flex flex-col items-center justify-center text-center px-4 py-10'
          : 'state-panel text-center mx-auto max-w-lg'
      }
    >
      {Icon && (
        <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] bg-primary/10 rounded-[1.4rem] flex items-center justify-center mx-auto mb-5">
          <Icon size={30} className="text-primary" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-poppins font-semibold text-xl text-brand-dark mb-2">{title}</h3>
      {message && (
        <p className="text-brand-muted max-w-md mx-auto mb-6 text-sm leading-relaxed">{message}</p>
      )}
      {actionLabel && (
        actionTo ? (
          <Link to={actionTo} className="btn-primary inline-flex">{actionLabel}</Link>
        ) : (
          <button type="button" onClick={onAction} className="btn-primary inline-flex">
            {actionLabel}
          </button>
        )
      )}
    </motion.div>
  );
}
