import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import VendorCard from '../common/VendorCard';
import { VendorSkeleton } from '../common/LoadingSkeleton';

export default function FeaturedVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorService.getAll({ limit: 6 })
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white py-14">
      <div className="page-container">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-title mb-1">Featured Vendors</h2>
            <p className="text-brand-muted text-sm">Talented women cooking with love</p>
          </div>
          <Link to="/vendors" className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
            See all <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <VendorSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <VendorCard vendor={vendor} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
