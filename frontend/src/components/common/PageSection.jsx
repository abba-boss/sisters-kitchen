import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Unified section card used across profile and dashboard surfaces.
 */
const PageSection = forwardRef(function PageSection(
  {
    id,
    title,
    subtitle,
    action,
    children,
    className = '',
    scrollMargin = false,
    animate = true,
  },
  ref
) {
  const Comp = animate ? motion.section : 'section';
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.32 },
      }
    : {};

  return (
    <Comp
      ref={ref}
      id={id}
      {...motionProps}
      className={`surface-card p-5 sm:p-6 ${scrollMargin || id ? 'scroll-mt-28' : ''} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            {title && <h2 className="heading-section">{title}</h2>}
            {subtitle && <p className="text-sm text-brand-muted mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </Comp>
  );
});

export default PageSection;
