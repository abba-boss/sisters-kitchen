import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BackButton({ 
  to, 
  label = 'Back',
  className = '',
  variant = 'default' // default, minimal, icon-only
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back in history
    }
  };

  if (variant === 'icon-only') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-brand-dark transition-all ${className}`}
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </motion.button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 text-sm text-brand-muted hover:text-brand-dark transition-colors ${className}`}
      >
        <ArrowLeft size={16} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ x: -3 }}
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-bg hover:bg-orange-100 text-brand-dark font-medium transition-all ${className}`}
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </motion.button>
  );
}

// Page header with back button
export function PageHeader({ 
  title, 
  subtitle, 
  backTo, 
  backLabel = 'Back',
  actions,
  showBack = true 
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <BackButton to={backTo} label={backLabel} variant="icon-only" />
          )}
          <div>
            <h1 className="font-poppins font-bold text-2xl text-brand-dark">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-brand-muted mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
