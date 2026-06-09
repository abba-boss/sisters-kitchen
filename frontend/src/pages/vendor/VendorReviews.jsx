import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/common/EmptyState';
import StarRating from '../../components/common/StarRating';
import { vendorService } from '../../services/vendorService';
import { reviewService } from '../../services/reviewService';
import { formatDate } from '../../utils/formatters';

export default function VendorReviews() {
  const [reviews, setReviews] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorService.getMyProfile().then(({ data }) => {
      const v = data.data;
      setVendor(v);
      return reviewService.getVendorReviews(v.id);
    })
      .then(({ data }) => setReviews(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));
  const totalReviews = reviews.length;

  return (
    <DashboardLayout>
      <h1 className="font-poppins font-bold text-xl text-brand-dark mb-6">Reviews & Ratings</h1>

      {!loading && vendor && (
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="text-center">
              <p className="font-poppins font-bold text-5xl text-primary">{Number(vendor.rating || 0).toFixed(1)}</p>
              <StarRating rating={vendor.rating || 0} size={20} />
              <p className="text-sm text-brand-muted mt-1">{totalReviews} reviews</p>
            </div>
            <div className="flex-1 space-y-2">
              {ratingDist.map(({ rating, count }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-brand-muted w-4">{rating}</span>
                  <Star size={12} className="text-primary flex-shrink-0" fill="#FF7A59" />
                  <div className="flex-1 bg-orange-50 rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-xs text-brand-muted w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" message="When customers rate your store, reviews will appear here." />
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary text-sm">{r.user?.firstName?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{r.user?.firstName} {r.user?.lastName}</p>
                    <p className="text-xs text-brand-muted">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <StarRating rating={r.rating} size={14} />
              </div>
              {r.comment && <p className="text-sm text-brand-muted leading-relaxed pl-12">{r.comment}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
