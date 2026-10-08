import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Store, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { vendorService } from '../../services/vendorService';

export default function RightSidebar() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorService
      .getAll({ limit: 3 })
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="hidden lg:block w-full space-y-5 sticky top-24 h-fit">
      {/* Trending Vendors */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-poppins font-semibold text-base text-brand-dark">
            Trending Vendors
          </h3>
          <Link to="/vendors" className="text-xs text-primary font-semibold hover:underline">
            See all
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <p className="text-sm text-brand-muted text-center py-4">No vendors yet</p>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link 
                  to={`/vendors/${vendor.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex-shrink-0">
                    <img
                      src={vendor.logo || `https://ui-avatars.com/api/?name=${vendor.businessName}&background=FF7A59&color=fff`}
                      alt={vendor.businessName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-dark truncate group-hover:text-primary transition-colors">
                      {vendor.businessName}
                    </p>
                    <p className="text-xs text-brand-muted truncate">
                      {vendor.address?.split(',')[0] || 'Lagos, Nigeria'}
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Follow
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Share & Earn */}
      <div className="bg-gradient-to-br from-primary to-orange-400 rounded-2xl p-5 text-white shadow-card">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
          <Store size={20} />
        </div>
        <h3 className="font-poppins font-bold text-base mb-1">Share & Earn</h3>
        <p className="text-xs text-white/80 mb-4">
          Invite friends and earn rewards with every order
        </p>
        <button className="w-full bg-white text-primary text-sm font-semibold py-2.5 rounded-xl hover:bg-orange-50 transition-colors">
          Learn More
        </button>
      </div>

      {/* Upcoming Live */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-poppins font-semibold text-base text-brand-dark">
            Upcoming Live
          </h3>
          <ChevronRight size={16} className="text-brand-muted" />
        </div>
        <div className="space-y-3">
          {vendors.slice(0, 2).map((vendor) => (
            <div key={vendor.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 relative">
                <img
                  src={vendor.logo || `https://ui-avatars.com/api/?name=${vendor.businessName}&background=FF7A59&color=fff`}
                  alt={vendor.businessName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-dark truncate">
                  {vendor.businessName}
                </p>
                <p className="text-xs text-brand-muted">Today, 4:30 PM</p>
              </div>
              <button className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                Reminder
              </button>
            </div>
          ))}
          {vendors.length === 0 && (
            <p className="text-sm text-brand-muted text-center py-4">No upcoming live sessions</p>
          )}
        </div>
      </div>
    </aside>
  );
}
