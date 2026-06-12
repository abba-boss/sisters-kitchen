import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';

const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Rice & Stew', icon: '🍛' },
  { id: '2', name: 'Shawarma', icon: '🌯' },
  { id: '3', name: 'Pizza', icon: '🍕' },
  { id: '4', name: 'Burgers', icon: '🍔' },
  { id: '5', name: 'Cakes & Pastries', icon: '🎂' },
  { id: '6', name: 'Smoothies & Drinks', icon: '🥤' },
  { id: '7', name: 'Snacks', icon: '🍟' },
  { id: '8', name: 'Local Dishes', icon: '🥘' },
];

const CATEGORY_IMAGES = {
  'Rice & Stew': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  Shawarma: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
  Pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
  Burgers: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
  'Cakes & Pastries': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
  'Smoothies & Drinks': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',
  Snacks: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
  'Local Dishes': 'https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=400',
  Fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
  Doughnuts: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
  'Grills & BBQ': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400',
  'Pasta & Noodles': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400';

function getCategoryImage(cat) {
  return cat.image || CATEGORY_IMAGES[cat.name] || DEFAULT_IMAGE;
}

/**
 * @param {{
 *   variant?: 'cards' | 'pills' | 'hero',
 *   activeId?: string,
 *   onSelect?: (id: string) => void,
 *   className?: string,
 * }} props
 */
export default function CategoryCarousel({
  variant = 'cards',
  activeId = '',
  onSelect,
  className = '',
}) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    categoryService.getAll().then(({ data }) => {
      if (data.data?.length) setCategories(data.data);
    }).catch(() => {});
  }, []);

  const isPillStyle = variant === 'pills' || variant === 'hero';

  const trackItems = variant === 'pills'
    ? [{ id: '', name: 'All', icon: null, isAll: true }, ...categories]
    : categories;

  const items = [...trackItems, ...trackItems];
  const duration = Math.max(trackItems.length * 2.5, 22);

  const handleSelect = (cat) => {
    if (variant === 'pills' && onSelect) {
      onSelect(cat.isAll ? '' : cat.id);
      return;
    }
    navigate(`/products?category=${cat.id}`);
  };

  const pauseProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onTouchStart: () => setPaused(true),
    onTouchEnd: () => setPaused(false),
  };

  const trackClass = variant === 'cards'
    ? 'category-scroll-track flex gap-4 py-2'
    : variant === 'hero'
      ? 'category-scroll-track flex gap-2 py-1'
      : 'category-scroll-track flex gap-2 py-1';

  const viewportClass = variant === 'hero'
    ? 'category-scroll-viewport-hero'
    : 'category-scroll-viewport';

  return (
    <div className={`${viewportClass} ${className}`} {...pauseProps}>
      <div
        className={`${trackClass}${paused ? ' is-paused' : ''}`}
        style={{ '--scroll-duration': `${duration}s` }}
      >
        {items.map((cat, i) => {
          if (isPillStyle) {
            const isActive = variant === 'pills' && (cat.isAll ? !activeId : activeId === cat.id);

            if (variant === 'hero') {
              return (
                <button
                  key={`${cat.id}-${i}`}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white rounded-full border border-orange-100 text-brand-muted hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-card"
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </button>
              );
            }

            return (
              <button
                key={`${cat.id || 'all'}-${i}`}
                type="button"
                onClick={() => handleSelect(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
                }`}
              >
                {cat.icon && <span>{cat.icon}</span>}
                <span>{cat.name}</span>
              </button>
            );
          }

          return (
            <button
              key={`${cat.id}-${i}`}
              type="button"
              onClick={() => handleSelect(cat)}
              className="flex-shrink-0 w-44 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden text-left group"
            >
              <div className="w-full h-28 overflow-hidden bg-primary/10 relative flex items-center justify-center">
                <span className="text-5xl absolute select-none" aria-hidden="true">
                  {cat.icon || '🍽️'}
                </span>
                <img
                  src={getCategoryImage(cat)}
                  alt={cat.name}
                  className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-center text-brand-dark text-sm group-hover:text-primary transition-colors">
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
