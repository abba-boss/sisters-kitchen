import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';

export default function VendorCard({ vendor }) {
  const cover = vendor.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';
  const logo  = vendor.logo || null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="card card-hover group overflow-hidden border border-orange-100/70"
    >
      <Link to={`/vendors/${vendor.id}`}>
        {/* Cover */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={cover}
            alt={vendor.businessName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-brand-dark/10 to-transparent" />

          {/* Open/Closed badge */}
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            vendor.isOpen ? 'bg-accent text-white' : 'bg-white/80 text-brand-muted'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${vendor.isOpen ? 'bg-white animate-pulse' : 'bg-brand-muted'}`} />
            {vendor.isOpen ? 'Open Now' : 'Closed'}
          </div>
        </div>

        {/* Logo + Info */}
        <div className="p-4 -mt-9 relative">
          <div className="flex items-end gap-3 mb-3">
            <div className="w-16 h-16 rounded-[1.25rem] border-[3px] border-white shadow-card overflow-hidden bg-brand-bg flex-shrink-0">
              {logo ? (
                <img
                  src={logo}
                  alt={vendor.businessName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="font-poppins font-bold text-primary text-xl">
                    {vendor.businessName?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1 flex-wrap">
                <h3 className="font-poppins font-semibold text-brand-dark text-sm leading-tight">
                  {vendor.businessName}
                </h3>
                {vendor.status === 'approved' && (
                  <CheckCircle size={13} className="text-accent flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          {vendor.description && (
            <p className="text-sm text-brand-muted line-clamp-2 mb-3 leading-relaxed">
              {vendor.description}
            </p>
          )}

          {/* Rating + Location — NO order count */}
          <div className="flex items-center justify-between text-xs text-brand-muted gap-3">
            <div className="flex items-center gap-1 min-w-0">
              <Star size={12} fill="#FF7A59" className="text-primary" />
              <span className="font-semibold text-brand-dark">
                {Number(vendor.rating || 0).toFixed(1)}
              </span>
              <span>({vendor.totalReviews || 0} reviews)</span>
            </div>
            {vendor.address && (
              <div className="flex items-center gap-1 min-w-0">
                <MapPin size={12} />
                <span className="truncate max-w-[110px]">{vendor.address}</span>
              </div>
            )}
          </div>

          {/* Hours */}
          {vendor.openingTime && vendor.closingTime && (
            <div className="flex items-center gap-1 mt-2 text-xs text-brand-muted">
              <Clock size={11} />
              <span>{vendor.openingTime} – {vendor.closingTime}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
