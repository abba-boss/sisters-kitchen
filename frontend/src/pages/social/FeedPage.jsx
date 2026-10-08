import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Flame, Users, Plus } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import PostCard from '../../components/social/PostCard';
import StoriesCarousel from '../../components/social/StoriesCarousel';
import WhatsCooking from '../../components/customer/WhatsKooking';
import CreatePostModal from '../../components/social/CreatePostModal';
import { postService } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';

const TABS = [
  { key: '', label: 'All', icon: Compass },
  { key: 'promotion', label: 'Deals', icon: Flame },
  { key: 'behind_scenes', label: 'Stories', icon: Users },
];

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    postService
      .getFeed({ type: filter || undefined, limit: 20 })
      .then(({ data }) => setPosts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <AppLayout hideFooter>
      {/* Stories */}
      <div className="mb-5">
        <StoriesCarousel />
      </div>

      {/* What's Cooking */}
      <div className="mb-5">
        <WhatsCooking />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-brand-dark">Food Feed</h1>
          <p className="text-sm text-brand-muted mt-1">Fresh stories and updates from local kitchens</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                filter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white border border-orange-100 text-brand-muted hover:border-primary hover:text-primary'
              }`}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Create Post Button - Vendors only */}
      {isAuthenticated && user?.role === 'vendor' && (
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full flex items-center gap-3 bg-white border border-orange-100 rounded-2xl px-4 py-3 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all group mb-5"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Plus size={20} className="text-primary" />
          </div>
          <span className="text-sm text-brand-muted group-hover:text-primary">What's cooking today?</span>
        </button>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-orange-100 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2 bg-gray-200 rounded w-20" />
                </div>
              </div>
              <div className="aspect-video bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brand-muted">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onCreated={() => {
          setShowCreatePost(false);
          window.location.reload();
        }}
      />
    </AppLayout>
  );
}
