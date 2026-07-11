import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Store, X } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import VendorCard from '../../components/common/VendorCard';
import { VendorSkeleton } from '../../components/common/LoadingSkeleton';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { vendorService } from '../../services/vendorService';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    vendorService.getAll({ page, limit: 12, search })
      .then(({ data }) => { setVendors(data.data || []); setMeta(data.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const filtered = openOnly ? vendors.filter((v) => v.isOpen) : vendors;

  return (
    <MainLayout>
      <div className="page-container page-shell">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="section-title mb-2">Our Vendors</h1>
          <p className="text-brand-muted">Discover talented female food vendors in your city</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search vendors…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input-field pl-11 h-11"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary">
                <X size={15} />
              </button>
            )}
          </div>
          <button
            onClick={() => setOpenOnly(!openOnly)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
              openOnly ? 'bg-accent text-white border-accent' : 'bg-white text-brand-muted border-orange-100 hover:border-accent hover:text-accent'
            }`}>
            <span className={`w-2 h-2 rounded-full ${openOnly ? 'bg-white' : 'bg-accent'}`} />
            Open Now
          </button>
        </div>

        {/* Stats */}
        {meta.total > 0 && (
          <p className="text-center text-sm text-brand-muted mb-6">
            {openOnly ? `${filtered.length} vendors open now` : `${meta.total} vendors found`}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => <VendorSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Store}
            title={openOnly ? 'No vendors open right now' : 'No vendors found'}
            message={openOnly ? 'Try removing the "Open Now" filter.' : 'Try a different search term.'}
            actionLabel={openOnly ? 'Show All' : undefined}
            onAction={openOnly ? () => setOpenOnly(false) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((vendor, i) => (
              <motion.div key={vendor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <VendorCard vendor={vendor} />
              </motion.div>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pages={meta.pages}
          onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      </div>
    </MainLayout>
  );
}
