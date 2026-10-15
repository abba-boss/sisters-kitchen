import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, ToggleLeft, ToggleRight, ChevronRight, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { formatPrice, formatDate } from '../../utils/formatters';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    categoryService.getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (categoryFilter) params.categoryId = categoryFilter;
    productService.getAll(params)
      .then(({ data }) => { setProducts(data.data || []); setMeta(data.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter]);

  const handleToggleAvailability = async (product) => {
    setUpdating(product.id);
    try {
      await api.patch(`/products/${product.id}`, { isAvailable: !product.isAvailable });
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p)
      );
      toast.success(product.isAvailable ? 'Product hidden' : 'Product visible');
    } catch { toast.error('Failed to update product'); }
    finally { setUpdating(null); }
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(window._productSearchTimer);
    window._productSearchTimer = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">All Products</h1>
          <p className="text-brand-muted text-sm">{meta.total} products in total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search products or vendors…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field pl-9 h-10 text-sm w-full"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input-field h-10 text-sm sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={28} className="animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card text-center py-16 px-6">
          <Package size={32} className="text-brand-muted mx-auto mb-3" />
          <p className="font-semibold text-brand-dark">No products found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden md:block rounded-[1.8rem] bg-white border border-orange-100 shadow-card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-orange-50">
                  <tr className="text-left">
                    <th className="px-5 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">Product</th>
                    <th className="px-4 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">Vendor</th>
                    <th className="px-4 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">Category</th>
                    <th className="px-4 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">Price</th>
                    <th className="px-4 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">Stock</th>
                    <th className="px-4 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-4 font-semibold text-brand-muted text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-brand-bg/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80'}
                            alt={product.name}
                            className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80'; }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-dark truncate max-w-[160px]">{product.name}</p>
                            <p className="text-xs text-brand-muted">{formatDate(product.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/vendors/${product.vendor?.id}`}
                          className="text-primary hover:underline font-medium truncate max-w-[120px] block"
                        >
                          {product.vendor?.businessName || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-brand-bg text-xs font-medium text-brand-muted">
                          {product.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-brand-dark">{formatPrice(Number(product.discountPrice) || Number(product.price))}</p>
                          {product.discountPrice && (
                            <p className="text-xs text-brand-muted line-through">{formatPrice(Number(product.price))}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-accent' : 'text-red-500'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.isAvailable ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {product.isAvailable ? 'Available' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            disabled={updating === product.id}
                            className="p-2 rounded-xl hover:bg-brand-bg transition-colors text-brand-muted hover:text-primary"
                            title={product.isAvailable ? 'Hide product' : 'Show product'}
                          >
                            {updating === product.id
                              ? <Loader size={15} className="animate-spin" />
                              : product.isAvailable ? <ToggleRight size={18} className="text-accent" /> : <ToggleLeft size={18} />}
                          </button>
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 rounded-xl hover:bg-brand-bg transition-colors text-brand-muted hover:text-primary"
                            title="View product"
                          >
                            <ChevronRight size={15} />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards (visible on mobile only) */}
          <div className="md:hidden space-y-3 mb-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className="card p-4"
              >
                {/* Product Header */}
                <div className="flex gap-3 mb-3">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80'}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-brand-dark mb-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/vendors/${product.vendor?.id}`} className="text-xs text-primary hover:underline">
                        {product.vendor?.businessName || '—'}
                      </Link>
                      {product.category?.name && (
                        <span className="text-xs text-brand-muted">• {product.category.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Details Grid */}
                <div className="grid grid-cols-3 gap-3 py-3 border-y border-orange-50">
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5">Price</p>
                    <p className="font-semibold text-brand-dark text-sm">
                      {formatPrice(Number(product.discountPrice) || Number(product.price))}
                    </p>
                    {product.discountPrice && (
                      <p className="text-xs text-brand-muted line-through">{formatPrice(Number(product.price))}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5">Stock</p>
                    <p className={`font-semibold text-sm ${product.stock > 0 ? 'text-accent' : 'text-red-500'}`}>
                      {product.stock}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      product.isAvailable ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.isAvailable ? 'Available' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3">
                  <button
                    onClick={() => handleToggleAvailability(product)}
                    disabled={updating === product.id}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      product.isAvailable
                        ? 'bg-accent/10 text-accent hover:bg-accent hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {updating === product.id ? (
                      <Loader size={14} className="animate-spin" />
                    ) : product.isAvailable ? (
                      <><ToggleRight size={14} /> Hide</>
                    ) : (
                      <><ToggleLeft size={14} /> Show</>
                    )}
                  </button>
                  <Link
                    to={`/products/${product.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                  >
                    View <ChevronRight size={14} />
                  </Link>
                </div>

                {/* Date */}
                <p className="text-xs text-brand-muted text-center mt-2">
                  Added {formatDate(product.createdAt)}
                </p>
              </motion.div>
            ))}
          </div>

          <Pagination
            page={page}
            pages={meta.pages}
            onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </>
      )}
    </DashboardLayout>
  );
}
