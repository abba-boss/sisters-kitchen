const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400';

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  fallback = FALLBACK_IMAGE,
  ...props
}) {
  return (
    <img
      src={src || fallback}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={(e) => {
        if (e.currentTarget.src !== fallback) {
          e.currentTarget.src = fallback;
        }
      }}
      {...props}
    />
  );
}

export { FALLBACK_IMAGE };
