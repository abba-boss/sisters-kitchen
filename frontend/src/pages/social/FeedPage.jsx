import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Flame, ChevronRight, Wifi } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostCard from '../../components/social/PostCard';
import PostSkeleton from '../../components/social/PostSkeleton';
import StoriesBar from '../../components/social/StoriesBar';
import { postService } from '../../services/postService';
import { useFeedStore } from '../../store/feedStore';
import { useSocketEvent } from '../../hooks/useSocket';

const LIMIT = 10;

const TABS = [
  { key: '',            label: 'For You'      },
  { key: 'promotion',   label: '🔥 Deals'     },
  { key: 'recipe',      label: '📖 Recipes'   },
  { key: 'availability',label: '✅ Available'  },
  { key: 'behind_scenes', label: '🎬 Stories'   },
];

export default function FeedPage() {
  const { posts, page, hasMore, loading, filter, setPosts, appendPosts, setPage, setHasMore, setLoading, setFilter, prependPost } = useFeedStore();
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const load = useCallback((pg = 1, reset = false) => {
    setLoading(true);
    postService.getFeed({ page: pg, limit: LIMIT, ...filter })
      .then(({ data }) => {
        const newPosts = data.data || [];
        if (reset || pg === 1) setPosts(newPosts); else appendPosts(newPosts);
        setHasMore(newPosts.length === LIMIT);
        setPage(pg);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(1, true); }, [filter]);

  const loadMore = useCallback(() => { if (!loading && hasMore) load(page + 1); }, [loading, hasMore, page]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  useSocketEvent('post:new', ({ post }) => prependPost(post));

  return (
    <MainLayout>
      {/* Stories at top of feed */}
      <StoriesBar />

      <div className="page-container py-5 max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-poppins font-bold text-xl text-brand-dark">Food Feed</h1>
            <p className="text-xs text-brand-muted flex items-center gap-1 mt-0.5">
              <Wifi size={10} className="text-accent"/> Live social commerce
            </p>
          </div>
          <Link to="/discover" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
            Discover <ChevronRight size={14}/>
          </Link>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-0.5">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter({ type: key })}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter.type === key ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {posts.length === 0 && loading ? (
          Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Compass size={28} className="text-primary"/>
            </div>
            <h3 className="font-poppins font-semibold text-brand-dark mb-1">No posts yet</h3>
            <p className="text-brand-muted text-sm">Vendors will post fresh content here!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
            <div ref={sentinelRef} className="h-4"/>
            {loading && hasMore && <><PostSkeleton /><PostSkeleton /></>}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-brand-muted text-xs py-8">
                You've seen it all — come back tomorrow! 🍽️
              </p>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
