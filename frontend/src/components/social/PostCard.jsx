import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  MapPin, ShoppingBag, ChevronRight, Trash2, CheckCircle,
  Clock3, PlayCircle, Sparkles, CalendarClock
} from 'lucide-react';
import { postService } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useFeedStore } from '../../store/feedStore';
import { timeAgo } from '../../utils/formatters';
import PostMediaGallery from './PostMediaGallery';
import PostComments from './PostComments';
import toast from 'react-hot-toast';

const POST_TYPE_BADGE = {
  promotion:    { label: '🔥 Promotion',      bg: 'bg-primary/10 text-primary' },
  availability: { label: '✅ Available Now',   bg: 'bg-accent/10 text-accent'  },
  announcement: { label: '📢 Announcement',   bg: 'bg-blue-50 text-blue-600'  },
  behind_scenes:{ label: '🎬 Behind the Scenes', bg: 'bg-purple-50 text-purple-600' },
  recipe:       { label: '📖 Recipe',          bg: 'bg-yellow-50 text-yellow-600' },
  customer_highlight: { label: '⭐ Customer Love', bg: 'bg-pink-50 text-pink-500' },
};

export default function PostCard({ post, showVendor = true, onDelete }) {
  const { isAuthenticated, user } = useAuthStore();
  const openAuth   = useAuthModalStore((s) => s.open);
  const { toggleLike, bumpComments, removePost } = useFeedStore();

  const [liked,        setLiked]        = useState(post._liked   ?? false);
  const [likesCount,   setLikesCount]   = useState(post.likesCount ?? 0);
  const [saved,        setSaved]        = useState(post._saved   ?? false);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [likeLoading,  setLikeLoading]  = useState(false);
  const [burstLike,    setBurstLike]    = useState(false);

  const isOwner = user?.id === post.author?.id ||
    user?.id === post.vendor?.user?.id;

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) { openAuth('Sign in to like posts'); return; }
    if (likeLoading) return;

    // Optimistic
    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : Math.max(likesCount - 1, 0);
    setLiked(newLiked);
    setLikesCount(newCount);
    if (newLiked) {
      setBurstLike(true);
      setTimeout(() => setBurstLike(false), 700);
    }
    toggleLike(post.id, newLiked, newCount);
    setLikeLoading(true);

    try {
      const { data } = await postService.toggleLike(post.id);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      toggleLike(post.id, data.liked, data.likesCount);
    } catch {
      // revert
      setLiked(liked);
      setLikesCount(likesCount);
      toggleLike(post.id, liked, likesCount);
    } finally { setLikeLoading(false); }
  }, [liked, likesCount, likeLoading, isAuthenticated, post.id]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) { openAuth('Sign in to save posts'); return; }
    try {
      const { data } = await postService.toggleSave(post.id);
      setSaved(data.saved);
      toast.success(data.saved ? 'Post saved ✨' : 'Removed from saved');
    } catch { toast.error('Failed to save post'); }
  }, [isAuthenticated, post.id]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link copied to clipboard!');
  }, [post.id]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await postService.delete(post.id);
      removePost(post.id);
      onDelete?.(post.id);
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete post'); }
  }, [post.id]);

  const typeBadge = POST_TYPE_BADGE[post.type];
  const heroProduct = post.product;
  const upcomingLabel = new Date(new Date(post.createdAt).getTime() + 24 * 60 * 60 * 1000)
    .toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] shadow-card border border-orange-100 overflow-hidden mb-5"
    >
      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {showVendor && (
            <Link to={`/vendors/${post.vendor?.id}`} className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex-shrink-0 ring-2 ring-primary/20">
                {post.vendor?.logo ? (
                  <img src={post.vendor.logo} alt={post.vendor.businessName}
                    className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-bold text-primary text-sm">
                    {post.vendor?.businessName?.[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-brand-dark group-hover:text-primary transition-colors leading-tight flex items-center gap-1.5">
                  {post.vendor?.businessName}
                  <CheckCircle size={13} className="text-accent" />
                </p>
                <p className="text-xs text-brand-muted flex items-center gap-1">
                  {post.location && <><MapPin size={10} />{post.location} · </>}
                  {timeAgo(post.createdAt)}
                </p>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {typeBadge && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge.bg}`}>
              {typeBadge.label}
            </span>
          )}
          {isOwner && (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-xl hover:bg-brand-bg text-brand-muted transition-all">
                <MoreHorizontal size={18} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-card-hover border border-orange-50 z-20 overflow-hidden"
                  >
                    <Link to={`/vendor/posts/${post.id}/edit`}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-brand-dark hover:bg-brand-bg transition-colors">
                      ✏️ Edit Post
                    </Link>
                    <button onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Media ────────────────────────────────── */}
      {post.media?.length > 0 && (
        <PostMediaGallery media={post.media} />
      )}

      <div className="px-4 pt-4">
        <SpecialLayoutBar
          post={post}
          heroProduct={heroProduct}
          upcomingLabel={upcomingLabel}
        />
      </div>

      {/* ── Caption ──────────────────────────────── */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1">
          <ExpandableCaption caption={post.caption} vendorName={post.vendor?.businessName} />
        </div>
      )}

      {/* ── Linked product pill ───────────────────── */}
      {post.product && (
        <div className="px-4 py-2">
          <Link to={`/products/${post.product.id}`}
            className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
            <ShoppingBag size={12} />
            {post.product.name}
            <ChevronRight size={11} />
          </Link>
        </div>
      )}

      {/* ── Tags ─────────────────────────────────── */}
      {post.tags?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
          ))}
        </div>
      )}

      <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
        {heroProduct && (
          <Link
            to={`/products/${heroProduct.id}`}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-primary-dark transition-colors shadow-soft"
          >
            <ShoppingBag size={15} />
            Order Now
          </Link>
        )}
        <Link
          to={`/vendors/${post.vendor?.id}`}
          className="inline-flex items-center gap-2 bg-white border border-orange-100 text-brand-dark text-sm font-semibold px-4 py-2.5 rounded-full hover:border-primary/30 hover:text-primary transition-colors"
        >
          View Store
        </Link>
      </div>

      {/* ── Actions ──────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-orange-50 relative">
        <AnimatePresence>
          {burstLike && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 8 }}
              animate={{ opacity: 1, scale: 1.1, y: -18 }}
              exit={{ opacity: 0 }}
              className="absolute left-10 -top-2 text-red-500 pointer-events-none"
            >
              ❤️
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-4">
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <motion.div animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.25 }}>
              <Heart
                size={22}
                className={liked ? 'text-red-500' : 'text-brand-muted group-hover:text-red-400 transition-colors'}
                fill={liked ? '#ef4444' : 'none'}
              />
            </motion.div>
            <span className={`text-sm font-semibold ${liked ? 'text-red-500' : 'text-brand-muted'}`}>
              {likesCount > 0 ? likesCount : ''}
            </span>
          </motion.button>

          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 group"
          >
            <MessageCircle size={22}
              className={`transition-colors ${showComments ? 'text-primary' : 'text-brand-muted group-hover:text-primary'}`} />
            <span className="text-sm font-semibold text-brand-muted">
              {post.commentsCount > 0 ? post.commentsCount : ''}
            </span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="group">
            <Share2 size={22} className="text-brand-muted group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* Save */}
        <motion.button whileTap={{ scale: 0.85 }} onClick={handleSave}>
          <Bookmark
            size={22}
            className={saved ? 'text-primary' : 'text-brand-muted hover:text-primary transition-colors'}
            fill={saved ? '#FF7A59' : 'none'}
          />
        </motion.button>
      </div>

      {/* ── Comments panel ───────────────────────── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <PostComments postId={post.id} onNewComment={() => bumpComments(post.id)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function SpecialLayoutBar({ post, heroProduct, upcomingLabel }) {
  if (post.type === 'promotion' && heroProduct) {
    return (
      <div className="rounded-[1.5rem] bg-gradient-to-r from-primary/10 to-orange-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-primary font-semibold">Today&apos;s Special</p>
          <p className="font-poppins font-bold text-brand-dark">{heroProduct.name}</p>
          <p className="text-sm text-brand-muted">Limited offer • {heroProduct.preparationTime || 'Fast delivery'}</p>
        </div>
        <div className="text-right">
          <p className="font-poppins font-bold text-primary text-lg">{heroProduct.discountPrice || heroProduct.price}</p>
          <p className="text-xs text-brand-muted flex items-center gap-1 justify-end"><Clock3 size={11} /> Ends soon</p>
        </div>
      </div>
    );
  }

  if (post.type === 'availability') {
    return (
      <div className="rounded-[1.5rem] bg-accent/10 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-accent font-semibold">Upcoming Meal Drop</p>
          <p className="font-poppins font-bold text-brand-dark">Tomorrow&apos;s kitchen schedule</p>
          <p className="text-sm text-brand-muted flex items-center gap-1"><CalendarClock size={13} /> {upcomingLabel}</p>
        </div>
        <button className="text-sm font-semibold text-accent bg-white px-4 py-2 rounded-full shadow-soft">Reserve</button>
      </div>
    );
  }

  if (post.type === 'behind_scenes') {
    return (
      <div className="rounded-[1.5rem] bg-purple-50 px-4 py-3 flex items-center gap-3">
        <PlayCircle size={18} className="text-purple-600" />
        <div>
          <p className="font-semibold text-brand-dark">Behind the scenes in the kitchen</p>
          <p className="text-sm text-brand-muted">Prep moments, plating, and what&apos;s coming out next.</p>
        </div>
      </div>
    );
  }

  if (post.type === 'customer_highlight') {
    return (
      <div className="rounded-[1.5rem] bg-pink-50 px-4 py-3 flex items-center gap-3">
        <Sparkles size={18} className="text-pink-500" />
        <div>
          <p className="font-semibold text-brand-dark">Customer review spotlight</p>
          <p className="text-sm text-brand-muted">Social proof from happy food lovers in your city.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Expandable caption ──────────────────────────────────────────
function ExpandableCaption({ caption, vendorName }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 150;
  const isLong = caption.length > LIMIT;

  return (
    <p className="text-sm text-brand-dark leading-relaxed">
      {isLong && !expanded ? (
        <>
          {caption.substring(0, LIMIT)}…{' '}
          <button onClick={() => setExpanded(true)} className="text-primary font-semibold">
            more
          </button>
        </>
      ) : (
        <>
          {caption}
          {isLong && (
            <button onClick={() => setExpanded(false)} className="text-primary font-semibold ml-1">
              less
            </button>
          )}
        </>
      )}
    </p>
  );
}
