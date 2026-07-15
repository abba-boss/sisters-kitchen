import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Bookmark, Share2,
  MoreHorizontal, ShoppingCart, Store, Flame, Tag,
  Clock, Star, ChevronRight, Trash2, X
} from 'lucide-react';
import { postService } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useFeedStore } from '../../store/feedStore';
import { useCart } from '../../hooks/useCart';
import { formatPrice, timeAgo } from '../../utils/formatters';
import OptimizedImage from '../common/OptimizedImage';
import PostComments from './PostComments';
import PostMediaGallery from './PostMediaGallery';
import toast from 'react-hot-toast';

const TYPE_BADGE = {
  promotion:    { label:'🔥 Promotion',        bg:'bg-red-50 text-red-500'       },
  availability: { label:'✅ Available Now',     bg:'bg-accent/10 text-accent'     },
  announcement: { label:'📢 Announcement',     bg:'bg-blue-50 text-blue-600'     },
  behind_scenes:{ label:'🎬 Behind the Scenes',bg:'bg-purple-50 text-purple-600' },
  recipe:       { label:'📖 Recipe',            bg:'bg-yellow-50 text-yellow-600' },
  customer_highlight:{ label:'⭐ Customer Love',bg:'bg-pink-50 text-pink-500'    },
};

export default function PostCard({ post, showVendor = true, compact = false, onDelete }) {
  const { isAuthenticated, user } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);
  const { toggleLike, bumpComments, removePost } = useFeedStore();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [liked,        setLiked]        = useState(post._liked  ?? false);
  const [likesCount,   setLikesCount]   = useState(post.likesCount  ?? 0);
  const [saved,        setSaved]        = useState(post._saved  ?? false);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [busy,         setBusy]         = useState(false);

  const isOwner = user?.id === post.author?.id || user?.id === post.vendor?.user?.id;
  const typeBadge = TYPE_BADGE[post.type];

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) { openAuth('Sign in to like posts'); return; }
    if (busy) return;
    const newLiked = !liked; const newCount = newLiked ? likesCount+1 : Math.max(likesCount-1,0);
    setLiked(newLiked); setLikesCount(newCount); toggleLike(post.id, newLiked, newCount);
    setBusy(true);
    try {
      const { data } = await postService.toggleLike(post.id);
      setLiked(data.liked); setLikesCount(data.likesCount); toggleLike(post.id, data.liked, data.likesCount);
    } catch { setLiked(liked); setLikesCount(likesCount); toggleLike(post.id, liked, likesCount); }
    finally { setBusy(false); }
  }, [liked, likesCount, busy, isAuthenticated, post.id]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) { openAuth('Sign in to save posts'); return; }
    try { const { data } = await postService.toggleSave(post.id); setSaved(data.saved); toast.success(data.saved ? 'Saved ✨' : 'Removed'); }
    catch { toast.error('Failed'); }
  }, [isAuthenticated, post.id]);

  const handleShare = () => { navigator.clipboard?.writeText(`${window.location.origin}/posts/${post.id}`); toast.success('Link copied!'); };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try { await postService.delete(post.id); removePost(post.id); onDelete?.(post.id); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!post.product) return;
    addToCart({ ...post.product, vendor: post.vendor });
  };

  return (
    <motion.article
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      className="bg-white rounded-3xl shadow-card overflow-hidden mb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          {showVendor && (
            <Link to={`/vendors/${post.vendor?.id}`} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0 bg-primary/10">
                {post.vendor?.logo
                  ? <OptimizedImage src={post.vendor.logo} alt={post.vendor.businessName} className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center font-bold text-primary text-sm">{post.vendor?.businessName?.[0]}</span>
                }
              </div>
              <div>
                <p className="font-semibold text-sm text-brand-dark group-hover:text-primary transition-colors leading-tight">
                  {post.vendor?.businessName}
                </p>
                <p className="text-xs text-brand-muted">{timeAgo(post.createdAt)}</p>
              </div>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {typeBadge && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge.bg}`}>{typeBadge.label}</span>}
          {isOwner && (
            <div className="relative">
              <button onClick={()=>setMenuOpen(!menuOpen)} className="p-1.5 rounded-xl hover:bg-brand-bg text-brand-muted transition-all">
                <MoreHorizontal size={17}/>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{opacity:0,scale:0.9,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9}}
                    className="absolute right-0 top-8 w-36 bg-white rounded-2xl shadow-card-hover border border-orange-50 z-20 overflow-hidden">
                    <Link to={`/vendor/posts/${post.id}/edit`} onClick={()=>setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-brand-dark hover:bg-brand-bg">✏️ Edit</Link>
                    <button onClick={()=>{setMenuOpen(false);handleDelete();}}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <Trash2 size={13}/> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {post.media?.length > 0 && <PostMediaGallery media={post.media} />}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1">
          <ExpandCaption caption={post.caption} />
        </div>
      )}

      {/* Product pill — shoppable post */}
      {post.product && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between bg-brand-bg rounded-2xl px-3 py-2.5">
            <Link to={`/products/${post.product.id}`} className="flex items-center gap-2 flex-1 min-w-0">
              {post.product.images?.[0] && (
                <img src={post.product.images[0]} alt={post.product.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand-dark truncate">{post.product.name}</p>
                <p className="text-xs text-primary font-bold">{formatPrice(Number(post.product.discountPrice)||Number(post.product.price))}</p>
              </div>
            </Link>
            <motion.button whileTap={{scale:0.88}} onClick={handleAddToCart}
              className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-soft hover:bg-primary-dark transition-colors flex-shrink-0 ml-2">
              <ShoppingCart size={14}/>
            </motion.button>
          </div>
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {post.tags.slice(0,5).map((t)=><span key={t} className="text-xs text-primary font-medium">#{t}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-orange-50">
        <div className="flex items-center gap-4">
          <motion.button whileTap={{scale:0.85}} onClick={handleLike} className="flex items-center gap-1.5 group">
            <motion.div animate={liked?{scale:[1,1.3,1]}:{}} transition={{duration:0.25}}>
              <Heart size={22} className={liked?'text-red-500':'text-brand-muted group-hover:text-red-400 transition-colors'} fill={liked?'#ef4444':'none'}/>
            </motion.div>
            {likesCount > 0 && <span className={`text-sm font-semibold ${liked?'text-red-500':'text-brand-muted'}`}>{likesCount}</span>}
          </motion.button>
          <button onClick={()=>setShowComments(!showComments)} className="flex items-center gap-1.5 group">
            <MessageCircle size={22} className={`transition-colors ${showComments?'text-primary':'text-brand-muted group-hover:text-primary'}`}/>
            {post.commentsCount>0 && <span className="text-sm font-semibold text-brand-muted">{post.commentsCount}</span>}
          </button>
          <button onClick={handleShare} className="group">
            <Share2 size={22} className="text-brand-muted group-hover:text-primary transition-colors"/>
          </button>
        </div>
        <motion.button whileTap={{scale:0.85}} onClick={handleSave}>
          <Bookmark size={22} className={saved?'text-primary':'text-brand-muted hover:text-primary transition-colors'} fill={saved?'#FF7A59':'none'}/>
        </motion.button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}} className="overflow-hidden">
            <PostComments postId={post.id} onNewComment={()=>bumpComments(post.id)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function ExpandCaption({ caption }) {
  const [exp, setExp] = useState(false);
  const LIMIT = 160;
  const long = caption.length > LIMIT;
  return (
    <p className="text-sm text-brand-dark leading-relaxed">
      {long && !exp ? <>{caption.slice(0,LIMIT)}… <button onClick={()=>setExp(true)} className="text-primary font-semibold">more</button></> : <>
        {caption}{long && <button onClick={()=>setExp(false)} className="text-primary font-semibold ml-1">less</button>}
      </>}
    </p>
  );
}
