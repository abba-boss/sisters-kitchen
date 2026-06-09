import { Star } from 'lucide-react';

/**
 * @param {number}  rating      - Current rating value (0–max)
 * @param {number}  max         - Max stars (default 5)
 * @param {number}  size        - Icon size in px
 * @param {boolean} interactive - If true, renders clickable stars
 * @param {function} onChange   - Called with new rating when clicked
 */
export default function StarRating({
  rating = 0,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half   = !filled && i < rating; // partial fill

        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none' : 'cursor-default'}
            aria-label={interactive ? `Rate ${i + 1} star${i !== 0 ? 's' : ''}` : undefined}
          >
            <Star
              size={size}
              className={filled || half ? 'text-primary' : 'text-orange-100'}
              fill={filled ? '#FF7A59' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
