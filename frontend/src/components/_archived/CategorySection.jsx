import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CategoryCarousel from './CategoryCarousel';

/** @param {{ embedded?: boolean }} props — embedded = inside hero banner */
export default function CategorySection({ embedded = false }) {
  const Tag = embedded ? 'div' : 'section';

  return (
    <Tag className={embedded ? 'pt-10 pb-14 border-t border-orange-100/60' : 'py-10'}>
      <div className="page-container flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title mb-1">Browse by Category</h2>
          <p className="text-brand-muted text-sm">Find exactly what you're craving today</p>
        </div>
        <Link
          to="/products"
          className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline flex-shrink-0"
        >
          Browse All Food <ChevronRight size={16} />
        </Link>
      </div>

      <CategoryCarousel variant="cards" />
    </Tag>
  );
}
