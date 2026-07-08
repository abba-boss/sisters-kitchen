import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Flame,
  Users,
  Search,
  Bell,
  MessageCircleMore,
  Bookmark,
  MapPin,
  Tag,
  Clock3,
  ChefHat,
  ChevronRight,
  Sparkles,
  PlayCircle,
  Store,
  Radio,
  UtensilsCrossed,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostCard from '../../components/social/PostCard';
import PostSkeleton from '../../components/social/PostSkeleton';
import StoriesBar from '../../components/social/StoriesBar';
import { postService } from '../../services/postService';
import { useFeedStore } from '../../store/feedStore';
import { useSocketEvent } from '../../hooks/useSocket';
import { vendorService } from '../../services/vendorService';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { useAuthStore } from '../../store/authStore';
import NotificationDropdown from '../../components/common/NotificationDropdown';
import FollowButton from '../../components/social/FollowButton';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

const TABS = [
  { key: '',           label: 'All',      icon: Compass },
  { key: 'promotion',  label: 'Deals',    icon: Flame   },
  { key: 'behind_scenes', label: 'Stories', icon: null  },
  { key: 'recipe',     label: 'Recipes',  icon: null    },
];

const LIMIT = 10;

export default function FeedPage() {
  const {
    posts, page, hasMore, loading, filter,
    setPosts, appendPosts, setPage, setHasMore,
    setLoading, setFilter, prependPost,
  } = useFeedStore();
  const { isAuthenticated, user } = useAuthStore();

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState(filter.search || '');
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Initial / filter-change load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    postService.getFeed({ page: 1, limit: LIMIT, ...filter })
      .then(({ data }) => {
        if (cancelled) return;
        setPosts(data.data || []);
        setHasMore((data.data || []).length === LIMIT);
        setPage(1);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filter]);

  // Load more (infinite scroll)
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setLoading(true);
    postService.getFeed({ page: nextPage, limit: LIMIT, ...filter })
      .then(({ data }) => {
        const newPosts = data.data || [];
        appendPosts(newPosts);
        setHasMore(newPosts.length === LIMIT);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loading, hasMore, page, filter]);

  // Intersection observer for sentinel
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  // Real-time new post from socket
  useSocketEvent('post:new', ({ post }) => { prependPost(post); });

  useEffect(() => {
    vendorService.getAll({ limit: 8 })
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {});
    productService.getAll({ limit: 8, sort: 'popular' })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {});
    categoryService.getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter({ search: search.trim() });
  };

  const timelineItems = useMemo(() => {
    const items = [];
    posts.forEach((post, index) => {
      items.push({ type: 'post', post, key: post.id });
      if ((index + 1) % 3 === 0) {
        items.push({ type: 'vendors', key: `vendors-${post.id}-${index}` });
      } else if ((index + 1) % 5 === 0) {
        items.push({ type: 'categories', key: `categories-${post.id}-${index}` });
      } else if ((index + 1) % 7 === 0) {
        items.push({ type: 'deals', key: `deals-${post.id}-${index}` });
      }
    });
    return items;
  }, [posts]);

  return (
    <MainLayout>
      <div className="page-container py-5 lg:py-6">
        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_300px] xl:grid-cols-[240px_minmax(0,1fr)_330px] gap-6 items-start">
          <aside className="hidden lg:block sticky top-24">
            <LeftRail
              filter={filter}
              onFilter={setFilter}
              isAuthenticated={isAuthenticated}
              onSavedClick={() => {
                if (!isAuthenticated) return toast('Sign in to view saved posts');
                navigate('/wishlist');
              }}
            />
          </aside>

          <section className="min-w-0">
            <FeedHeader
              search={search}
              setSearch={setSearch}
              onSearch={handleSearch}
              isAuthenticated={isAuthenticated}
              user={user}
            />

            <StoriesBar />

            <div className="mt-5 mb-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-brand-dark">Food Feed</h1>
                  <p className="text-brand-muted text-sm mt-1">Fresh stories, cooking videos, upcoming meals, and deal drops from local kitchens.</p>
                </div>
                <Link to="/vendors" className="hidden sm:flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  <Users size={15} /> Browse vendors
                </Link>
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setFilter({ type: key })}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      filter.type === key
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {Icon && <Icon size={14} />}{label}
                  </button>
                ))}
              </div>
            </div>

            {posts.length === 0 && loading ? (
              Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
            ) : posts.length === 0 ? (
              <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card text-center py-16 px-6">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4"
                >
                  <ChefHat size={28} className="text-primary" />
                </motion.div>
                <h3 className="font-poppins font-semibold text-brand-dark mb-1">No posts in this feed yet</h3>
                <p className="text-brand-muted text-sm">Try another filter or come back when more kitchens share updates.</p>
              </div>
            ) : (
              <>
                <div className="space-y-5">
                  {timelineItems.map((item) => {
                    if (item.type === 'post') {
                      return <PostCard key={item.key} post={item.post} />;
                    }
                    if (item.type === 'vendors') {
                      return <InlineVendorsCard key={item.key} vendors={vendors.slice(0, 3)} />;
                    }
                    if (item.type === 'categories') {
                      return <InlineCategoriesCard key={item.key} categories={categories.slice(0, 5)} />;
                    }
                    return <InlineDealsCard key={item.key} products={products.slice(0, 3)} />;
                  })}
                </div>

                <div ref={sentinelRef} className="h-4" />

                {loading && hasMore && (
                  <div className="space-y-4 mt-4">
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-brand-muted text-xs py-6">
                    You&apos;ve seen all posts for now. Fresh meals will show up again soon.
                  </p>
                )}
              </>
            )}
          </section>

          <aside className="hidden lg:block sticky top-24">
            <RightRail vendors={vendors} products={products} categories={categories} />
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}

function FeedHeader({ search, setSearch, onSearch, isAuthenticated, user }) {
  return (
    <div className="sticky top-20 z-30 mb-5">
      <div className="bg-white/75 backdrop-blur-2xl border border-orange-100 shadow-card rounded-[1.7rem] px-4 py-3">
        <div className="flex items-center gap-3">
          <form onSubmit={onSearch} className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts, meals, vendors..."
              className="w-full h-11 rounded-full bg-white border border-orange-100 pl-11 pr-4 text-sm text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all"
            />
          </form>

          <div className="hidden sm:flex items-center gap-2">
            <NotificationDropdown />
            <button
              onClick={() => toast('Messaging UI coming soon')}
              className="w-11 h-11 rounded-full bg-white border border-orange-100 text-brand-muted hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center"
            >
              <MessageCircleMore size={18} />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-white border border-orange-100 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.firstName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{user?.firstName?.[0] || 'G'}</span>
                )}
              </div>
              <div className="hidden xl:block pr-1">
                <p className="text-xs font-semibold text-brand-dark">{isAuthenticated ? `${user?.firstName || 'Foodie'}` : 'Guest'}</p>
                <p className="text-[11px] text-brand-muted">{isAuthenticated ? 'Food lover' : 'Explore feed'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftRail({ filter, onFilter, isAuthenticated, onSavedClick }) {
  const items = [
    { label: 'Stories Shortcut', icon: Radio, action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Trending', icon: Flame, action: () => onFilter({ type: '' }) },
    { label: 'Following', icon: Users, action: () => onFilter({ type: 'behind_scenes' }) },
    { label: 'Nearby Vendors', icon: MapPin, action: () => onFilter({ search: 'nearby' }) },
    { label: 'Saved Posts', icon: Bookmark, action: onSavedClick },
    { label: 'Deals', icon: Tag, action: () => onFilter({ type: 'promotion' }) },
    { label: 'Recipes', icon: UtensilsCrossed, action: () => onFilter({ type: 'recipe' }) },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted mb-3">Explore</p>
        <div className="space-y-1.5">
          {items.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-brand-dark hover:bg-brand-bg transition-colors"
            >
              <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon size={16} />
              </span>
              <span className="text-left">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-gradient-to-br from-brand-dark to-[#6F463F] text-white p-4 shadow-card">
        <p className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2">Today&apos;s mood</p>
        <h3 className="font-poppins font-bold text-lg leading-tight">Scroll. Discover. Order.</h3>
        <p className="text-sm text-white/70 mt-2">Fresh homemade dishes and kitchen updates from women-led vendors.</p>
      </div>
    </div>
  );
}

function RightRail({ vendors, products, categories }) {
  return (
    <div className="space-y-4">
      <SidebarCard title="Trending Foods" subtitle="Most clicked dishes">
        <div className="space-y-3">
          {products.slice(0, 4).map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="flex items-center gap-3 group">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120'}
                alt={product.name}
                className="w-12 h-12 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-dark truncate group-hover:text-primary transition-colors">{product.name}</p>
                <p className="text-xs text-brand-muted truncate">{product.vendor?.businessName}</p>
              </div>
              <span className="text-xs font-bold text-primary">{formatPrice(Number(product.discountPrice) || Number(product.price))}</span>
            </Link>
          ))}
        </div>
      </SidebarCard>

      <SidebarCard title="Top Vendors" subtitle="Who&apos;s cooking today">
        <div className="space-y-3">
          {vendors.slice(0, 3).map((vendor) => (
            <div key={vendor.id} className="flex items-center gap-3">
              <Link to={`/vendors/${vendor.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={vendor.logo || vendor.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120'}
                  alt={vendor.businessName}
                  className="w-11 h-11 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-dark truncate">{vendor.businessName}</p>
                  <p className="text-xs text-brand-muted truncate">{vendor.isOpen ? 'Cooking now' : 'Closed now'}</p>
                </div>
              </Link>
              <FollowButton vendorId={vendor.id} size="sm" variant="outline" />
            </div>
          ))}
        </div>
      </SidebarCard>

      <SidebarCard title="Live Orders" subtitle="Fast-moving kitchen activity">
        <div className="space-y-2">
          {products.slice(0, 3).map((product, index) => (
            <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-brand-bg px-3 py-2.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{product.vendor?.businessName}</p>
                <p className="text-xs text-brand-muted truncate">New order for {product.name}</p>
              </div>
              <span className="text-[11px] text-brand-muted ml-auto">{index + 1}m</span>
            </div>
          ))}
        </div>
      </SidebarCard>

      <SidebarCard title="Popular Categories" subtitle="Jump into cravings">
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="px-3 py-2 rounded-full bg-brand-bg text-xs font-semibold text-brand-dark hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {category.icon || '🍽️'} {category.name}
            </Link>
          ))}
        </div>
      </SidebarCard>
    </div>
  );
}

function SidebarCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-4">
      <div className="mb-3">
        <h3 className="font-poppins font-bold text-base text-brand-dark">{title}</h3>
        <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function InlineVendorsCard({ vendors }) {
  if (!vendors.length) return null;
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-white to-orange-50 border border-orange-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Discovery</p>
          <h3 className="font-poppins font-bold text-xl text-brand-dark">Trending vendors near you</h3>
        </div>
        <Link to="/vendors" className="text-sm font-semibold text-primary inline-flex items-center gap-1">See all <ChevronRight size={14} /></Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {vendors.map((vendor) => (
          <Link key={vendor.id} to={`/vendors/${vendor.id}`} className="rounded-3xl bg-white border border-orange-100 p-3 hover:shadow-soft transition-all">
            <img
              src={vendor.coverImage || vendor.logo || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300'}
              alt={vendor.businessName}
              className="w-full h-28 rounded-2xl object-cover mb-3"
            />
            <p className="font-semibold text-sm text-brand-dark truncate">{vendor.businessName}</p>
            <p className="text-xs text-brand-muted truncate">{vendor.address || 'Homemade kitchen'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function InlineCategoriesCard({ categories }) {
  if (!categories.length) return null;
  return (
    <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-primary" />
        <h3 className="font-poppins font-bold text-xl text-brand-dark">Popular categories</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products?category=${category.id}`}
            className="px-4 py-2 rounded-full bg-brand-bg border border-orange-100 text-sm font-semibold text-brand-dark hover:text-primary hover:border-primary/30 transition-colors"
          >
            {category.icon || '🍽️'} {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function InlineDealsCard({ products }) {
  if (!products.length) return null;
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-primary to-orange-500 text-white shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} />
        <div>
          <h3 className="font-poppins font-bold text-xl">Flash deals</h3>
          <p className="text-sm text-white/80">Fast-moving offers and limited meals.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {products.map((product) => (
          <Link key={product.id} to={`/products/${product.id}`} className="rounded-3xl bg-white/12 border border-white/15 p-3 backdrop-blur-sm hover:bg-white/16 transition-colors">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300'}
              alt={product.name}
              className="w-full h-28 rounded-2xl object-cover mb-3"
            />
            <p className="font-semibold text-sm truncate">{product.name}</p>
            <p className="text-xs text-white/75 truncate">{product.vendor?.businessName}</p>
            <p className="text-sm font-bold mt-2">{formatPrice(Number(product.discountPrice) || Number(product.price))}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
