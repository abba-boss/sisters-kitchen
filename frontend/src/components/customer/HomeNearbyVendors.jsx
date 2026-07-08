import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Star } from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import VendorCard from '../common/VendorCard';

const CITY_KEYS = ['lagos', 'abuja', 'kano', 'port harcourt', 'ibadan', 'kaduna'];

export default function HomeNearbyVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorService
      .getAll({ limit: 12 })
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const nearby = useMemo(() => {
    const filtered = vendors.filter((v) =>
      CITY_KEYS.some((k) => (v.address || '').toLowerCase().includes(k))
    );
    return (filtered.length ? filtered : vendors).slice(0, 6);
  }, [vendors]);

  return (
    <section className="py-10 bg-[#FFF6EE]">
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-poppins font-bold text-2xl text-brand-dark">Nearby Kitchens</h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <MapPin size={11} /> Near you
              </span>
            </div>
            <p className="text-sm text-brand-muted mt-1">Fast delivery from trusted vendors in your city.</p>
          </div>
          <Link to="/vendors" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
            Browse vendors <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton rounded-3xl h-72" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nearby.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
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
