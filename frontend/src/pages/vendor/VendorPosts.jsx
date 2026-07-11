import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid3X3, List, Edit2, Trash2, Eye, EyeOff, Flame, PenSquare } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreatePostModal from '../../components/social/CreatePostModal';
import EmptyState from '../../components/common/EmptyState';
import { postService } from '../../services/postService';
import { timeAgo, formatNumber } from '../../utils/formatters';
import { useSocketEvent } from '../../hooks/useSocket';
import { useFeedStore } from '../../store/feedStore';
import toast from 'react-hot-toast';

const STATUS_TABS = ['all', 'published', 'draft', 'archived'];

export default function VendorPosts() {
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [viewMode,    setViewMode]    = useState('grid'); // grid | list
  const [statusFilter, setStatusFilter] = useState('all');
  const { prependPost } = useFeedStore();

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = statusFilter !== 'all' ? { status: statusFilter, limit: 50 } : { limit: 50 };
    postService.getMyPosts(params)
      .then(({ data }) => setPosts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Real-time new post
  useSocketEvent('post:new', ({ post }) => {
    setPosts((prev) => [post, ...prev]);
    prependPost(post);
  });

  const handleCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await postService.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete post'); }
  };

  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'archived' : 'published';
    try {
      await postService.update(post.id, { status: newStatus });
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: newStatus } : p));
      toast.success(newStatus === 'published' ? 'Post published ✅' : 'Post archived');
    } catch { toast.error('Failed to update post'); }
  };

  const statusColor = {
    published: 'badge-success',
    draft:     'badge-warning',
    archived:  'bg-gray-100 text-gray-500 badge',
    deleted:   'badge-danger',
  };

  return (
    <DashboardLayout>
      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">My Posts</h1>
          <p className="text-brand-muted text-sm">{posts.length} posts · Engage your audience</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-2.5 text-sm"
        >
          <Plus size={16} /> Create Post
        </button>
      </div>

      {/* Tabs + view toggle */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                statusFilter === s ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100'
              }`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-orange-100">
          <button onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-brand-muted hover:text-primary'}`}>
            <Grid3X3 size={15} />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-brand-muted hover:text-primary'}`}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square skeleton rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        )
      ) : posts.length === 0 ? (
        <EmptyState
          icon={PenSquare}
          title="No posts yet"
          message="Create your first post to start engaging with customers!"
          actionLabel="Create Post"
          onAction={() => setModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence>
            {posts.map((post, i) => {
              const cover = post.media?.[0]?.url;
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-brand-bg group cursor-pointer"
                >
                  {cover ? (
                    <img src={cover} alt={post.caption} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 p-3">
                      <p className="text-xs text-brand-muted text-center line-clamp-3">{post.caption}</p>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-2 text-white text-xs">
                      <span>❤️ {post.likesCount}</span>
                      <span>💬 {post.commentsCount}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleStatus(post)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                        {post.status === 'published' ? <EyeOff size={14} className="text-white" /> : <Eye size={14} className="text-white" />}
                      </button>
                      <button onClick={() => handleDelete(post.id)}
                        className="p-2 bg-red-500/80 rounded-lg hover:bg-red-600/80 transition-all">
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Status badge */}
                  {post.status !== 'published' && (
                    <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor[post.status]}`}>
                      {post.status}
                    </span>
                  )}
                  {post.isFreshToday && (
                    <span className="absolute top-2 right-2 text-xs"><Flame size={14} className="text-primary" /></span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {posts.map((post, i) => {
              const cover = post.media?.[0]?.url;
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                    {cover
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">📝</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-dark line-clamp-1">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-brand-muted">
                      <span>❤️ {post.likesCount}</span>
                      <span>💬 {post.commentsCount}</span>
                      <span>👁 {post.viewsCount}</span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${statusColor[post.status]} capitalize text-xs`}>{post.status}</span>
                    <button onClick={() => handleToggleStatus(post)}
                      className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all">
                      {post.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => handleDelete(post.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
}
