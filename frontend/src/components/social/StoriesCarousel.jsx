import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useAuthStore } from '../../store/authStore';

export default function StoriesCarousel() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    storyService.getFeed()
      .then(({ data }) => {
        // Group by vendor
        const grouped = {};
        (data.data || []).forEach((story) => {
          const vendorId = story.vendor?.id;
          if (!vendorId) return;
          if (!grouped[vendorId]) {
            grouped[vendorId] = {
              vendor: story.vendor,
              stories: [],
              hasNew: true,
            };
          }
          grouped[vendorId].stories.push(story);
        });
        setStories(Object.values(grouped));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="mt-1.5 h-2 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {/* Add Story - if user is vendor */}
      {isAuthenticated && user?.role === 'vendor' && (
        <Link to="/vendor/stories/new" className="flex-shrink-0 text-center group">
          <div className="relative w-16 h-16">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center border-2 border-dashed border-orange-300 group-hover:border-primary transition-colors">
              <Plus size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-xs font-medium text-brand-dark mt-1.5 truncate w-16">Your Story</p>
        </Link>
      )}

      {/* Story Items */}
      {stories.map((item, index) => (
        <StoryItem key={item.vendor.id} item={item} index={index} />
      ))}
    </div>
  );
}

function StoryItem({ item, index }) {
  const { vendor, hasNew } = item;

  return (
    <Link 
      to={`/vendors/${vendor.id}`} 
      className="flex-shrink-0 text-center group"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="relative w-16 h-16"
      >
        {/* Gradient ring for new stories */}
        {hasNew && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-orange-400 to-yellow-400 p-[2.5px]">
            <div className="w-full h-full rounded-full bg-white p-[2px]">
              <img
                src={vendor.logo || `https://ui-avatars.com/api/?name=${vendor.businessName}&background=FF7A59&color=fff`}
                alt={vendor.businessName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        )}
        
        {/* No ring for viewed stories */}
        {!hasNew && (
          <div className="w-full h-full rounded-full border-2 border-gray-200 p-[2px]">
            <img
              src={vendor.logo || `https://ui-avatars.com/api/?name=${vendor.businessName}&background=FF7A59&color=fff`}
              alt={vendor.businessName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        )}
      </motion.div>
      <p className="text-xs font-medium text-brand-dark mt-1.5 truncate w-16">
        {vendor.businessName?.split(' ')[0]}
      </p>
    </Link>
  );
}
