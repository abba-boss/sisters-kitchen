import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/common/ProductCard';
import StoriesCarousel from '../../components/social/StoriesCarousel';
import WhatsCooking from '../../components/customer/WhatsKooking';
import { EmptySearchResults } from '../../components/common/EmptyState';
import { ProductCardSkeleton } from '../../components/common/SkeletonLoader';
import { productService } from '../../services/productService';
import { ShoppingBag } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(localSearch, 300);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    setSearchParams(p);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setParam('search', localSearch.trim());
  };

  const fetchProducts = useCallback(() => {
    setLoading(true);
    productService
      .getAll({ limit: 20, search, category })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const showDiscovery = !search && !category;

  return (
    <MainLayout hideFooter>
      {/* Stories - Always show */}
      <div className="mb-5">
        <StoriesCarousel />
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-5">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search for food, vendors, dishes..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full h-12 rounded-2xl bg-white border border-orange-100 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setParam('search', '');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* What's Cooking - Show in discovery mode */}
      {showDiscovery && (
        <div className="mb-6">
          <WhatsCooking onSelect={(id) => setParam('category', id)} selectedId={category} />
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-poppins font-semibold text-lg text-brand-dark">
            {search ? `Results for "${search}"` : category ? 'Filtered Products' : 'Recommended for you'}
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            {loading ? 'Loading...' : `${products.length} items`}
          </p>
        </div>
        {(search || category) && (
          <button
            onClick={() => {
              setSearchParams({});
              setLocalSearch('');
            }}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptySearchResults 
          query={search}
          onClear={() => {
            setSearchParams({});
            setLocalSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
