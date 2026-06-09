import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Search, ChevronDown } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/common/ProductCard';
import { GridSkeleton } from '../../components/common/LoadingSkeleton';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { ShoppingBag } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Latest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  // Read from URL params
  const page    = Number(searchParams.get('page') || 1);
  const search  = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort    = searchParams.get('sort') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const clearAll = () => { setSearchParams({}); setLocalSearch(''); };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setParam('search', localSearch.trim());
  };

  const hasFilters = search || category || sort || minPrice || maxPrice;

  useEffect(() => {
    categoryService.getAll().then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    productService.getAll({ page, limit: 12, search, category, sort, minPrice, maxPrice })
      .then(({ data }) => { setProducts(data.data || []); setMeta(data.meta || { total: 0, pages: 1 }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, category, sort, minPrice, maxPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <MainLayout>
      <div className="page-container py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title mb-1">
            {search ? `Results for "${search}"` : 'Browse All Food'}
          </h1>
          <p className="text-brand-muted text-sm">{meta.total} items found</p>
        </div>

        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search food, vendors…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="input-field pl-11 pr-4 h-11"
            />
          </form>
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
                className="appearance-none input-field py-2.5 pr-8 text-sm cursor-pointer min-w-[150px]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                filtersOpen || hasFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-brand-dark border-orange-100 hover:border-primary hover:text-primary'
              }`}>
              <SlidersHorizontal size={16} />
              Filters {hasFilters && '●'}
            </button>
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 text-sm text-red-500 hover:underline font-medium px-2">
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-card p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2 block">Category</label>
                  <select value={category} onChange={(e) => setParam('category', e.target.value)} className="input-field py-2 text-sm">
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2 block">Min Price (₦)</label>
                  <input type="number" value={minPrice} onChange={(e) => setParam('minPrice', e.target.value)} placeholder="0" className="input-field py-2 text-sm" min="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2 block">Max Price (₦)</label>
                  <input type="number" value={maxPrice} onChange={(e) => setParam('maxPrice', e.target.value)} placeholder="100,000" className="input-field py-2 text-sm" min="0" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Pills (quick filter) */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
            <button
              onClick={() => setParam('category', '')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !category ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
              }`}>
              All
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setParam('category', c.id === category ? '' : c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === c.id ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
                }`}>
                <span>{c.icon}</span>{c.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <GridSkeleton count={12} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No products found"
            message="Try adjusting your search or filters."
            actionLabel="Clear Filters"
            onAction={clearAll}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <Pagination
          page={page}
          pages={meta.pages}
          onChange={(p) => {
            const ps = new URLSearchParams(searchParams);
            ps.set('page', p);
            setSearchParams(ps);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </MainLayout>
  );
}
