import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Store, X } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import VendorCard from '../../components/common/VendorCard';
import { vendorService } from '../../services/vendorService';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    vendorService
      .getAll()
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredVendors = search.trim()
    ? vendors.filter((v) => v.businessName?.toLowerCase().includes(search.toLowerCase()))
    : vendors;

  return (
    <AppLayout hideFooter>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-poppins font-bold text-2xl text-brand-dark mb-2">Explore Vendors</h1>
        <p className="text-sm text-brand-muted">Discover amazing local female chefs and home cooks</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 rounded-2xl bg-white border border-orange-100 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-orange-100 p-4 animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-12">
          <Store size={48} className="mx-auto text-brand-muted mb-4" />
          <p className="text-brand-muted">
            {search ? 'No vendors found matching your search' : 'No vendors available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredVendors.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <VendorCard vendor={vendor} />
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
