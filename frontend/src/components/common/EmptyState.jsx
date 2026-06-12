import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, message, actionLabel, actionTo, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4"
    >
      {Icon && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5">
          <Icon size={34} className="text-primary" />
        </div>
      )}
      <h3 className="font-poppins font-semibold text-xl text-brand-dark mb-2">{title}</h3>
      {message && <p className="text-brand-muted max-w-sm mb-6 text-sm leading-relaxed">{message}</p>}
      {actionLabel && (
        actionTo ? (
          <Link to={actionTo} className="btn-primary">{actionLabel}</Link>
        ) : (
          <button onClick={onAction} className="btn-primary">{actionLabel}</button>
        )
      )}
    </motion.div>
  );
}
