import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Star } from "lucide-react";
import { vendorService } from "../../services/vendorService";
import { useAuthStore } from "../../store/authStore";

export default function HomeTopVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    vendorService
      .getAll({ limit: 6, sort: "rating" })
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-8 bg-[#FFF6EE]">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-poppins font-bold text-xl text-brand-dark">
              Top Rated Vendors
            </h2>
            <span className="text-lg">⭐</span>
          </div>
          <Link
            to="/vendors"
            className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
          >
            See all <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-44 skeleton rounded-3xl h-56"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {vendors.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function VendorCard({ vendor, index }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.07 }}
      className="flex-shrink-0 w-40 sm:w-44 bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      {/* Cover */}
      <div
        className="relative h-24 cursor-pointer overflow-hidden"
        onClick={() => navigate(`/vendors/${vendor.id}`)}
      >
        <img
          src={
            vendor.coverImage ||
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"
          }
          alt={vendor.businessName}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400";
          }}
        />
        {/* Open pill */}
        <div
          className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white ${vendor.isOpen ? "bg-accent" : "bg-gray-400"}`}
        />
      </div>

      {/* Avatar + info */}
      <div className="px-3 pt-0 pb-3 -mt-5 relative">
        <div
          className="w-10 h-10 rounded-2xl border-2 border-white shadow-card overflow-hidden bg-brand-bg mx-auto mb-2 cursor-pointer"
          onClick={() => navigate(`/vendors/${vendor.id}`)}
        >
          {vendor.logo ? (
            <img
              src={vendor.logo}
              alt={vendor.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {vendor.businessName?.[0]}
              </span>
            </div>
          )}
        </div>

        <p
          className="font-semibold text-brand-dark text-xs text-center truncate cursor-pointer hover:text-primary transition-colors mb-0.5"
          onClick={() => navigate(`/vendors/${vendor.id}`)}
        >
          {vendor.businessName}
        </p>

        <div className="flex items-center justify-center gap-1 text-xs text-brand-muted mb-1">
          <Star size={10} fill="#FF7A59" className="text-primary" />
          <span className="font-semibold text-brand-dark">
            {Number(vendor.rating || 0).toFixed(1)}
          </span>
        </div>

        <p className="text-xs text-brand-muted text-center mb-3">
          {vendor.totalOrders}+ orders
        </p>

        {/* View Store button */}
        <button
          onClick={() => navigate(`/vendors/${vendor.id}`)}
          className="w-full text-xs font-semibold text-primary border border-primary/30 rounded-full py-1.5 hover:bg-primary hover:text-white transition-all"
        >
          View Store
        </button>
      </div>
    </motion.div>
  );
}
