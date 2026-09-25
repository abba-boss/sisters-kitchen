import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bookmark,
  ChefHat,
  ChevronRight,
  Compass,
  Flame,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostCard from '../../components/social/PostCard';
import PostSkeleton from '../../components/social/PostSkeleton';
import StoriesBar from '../../components/social/StoriesBar';
import FeedComposer from '../../components/social/FeedComposer';
import NotificationDropdown from '../../components/common/NotificationDropdown';
import FollowButton from '../../components/social/FollowButton';
import { postService } from '../../services/postService';
import { vendorService } from '../../services/vendorService';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { useFeedStore } from '../../store/feedStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useSocketEvent } from '../../hooks/useSocket';
import { formatPrice } from '../../utils/formatters';

const LIMIT = 10;

// The API resolves like/save state for the whole page in two batched queries,
// so no extra request per post is needed here.
function hydrateViewerState(items) {
  return items.map((post) => ({
    ...post,
    _liked: post.viewerState?.liked ?? post._liked ?? false,
    _saved: post.viewerState?.saved ?? post._saved ?? false,
  }));
}

const FEED_TABS = [
  { key: 'for-you', label: 'For you', type: '' },
  { key: 'following', label: 'Following', type: null },
  { key: 'recipes', label: 'Recipes', type: 'recipe' },
  { key: 'offers', label: 'Offers', type: 'promotion' },
];

export default function FeedPage() {
  const {
    posts,
    page,
    hasMore,
    loading,
    filter,
    setPosts,
    appendPosts,
    setPage,
    setHasMore,
    setLoading,
    setFilter,
    prependPost,
  } = useFeedStore();
  const { isAuthenticated, user } = useAuthStore();
  const openAuth = useAuthModalStore((state) => state.open);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearch);
  const [activeTab, setActiveTab] = useState('for-you');
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [feedError, setFeedError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setSearch(urlSearch);
    setActiveTab('for-you');
    setFilter({ type: '', vendorId: '', search: urlSearch });
  }, [urlSearch, setFilter]);

  const loadFollowingFeed = useCallback(async () => {
    setLoading(true);
    setFeedError('');

    try {
      const { data } = await postService.getFollowingFeed({ page: 1, limit: LIMIT });
      const items = data.data || [];
      setFollowingIds([...new Set(items.map((post) => post.vendor?.id).filter(Boolean))]);
      setPosts(hydrateViewerState(items));
      setHasMore(items.length === LIMIT);
      setPage(1);
    } catch {
      setPosts([]);
      setHasMore(false);
      setFeedError('We could not load kitchens you follow. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setHasMore, setLoading, setPage, setPosts]);

  useEffect(() => {
    if (activeTab === 'following') return undefined;

    let cancelled = false;
    setLoading(true);
    setFeedError('');

    postService
      .getFeed({ page: 1, limit: LIMIT, ...filter })
      .then(({ data }) => {
        if (cancelled) return;
        const items = data.data || [];
        setPosts(hydrateViewerState(items));
        setHasMore(items.length === LIMIT);
        setPage(1);
      })
      .catch(() => {
        if (cancelled) return;
        setPosts([]);
        setHasMore(false);
        setFeedError('The food feed could not be loaded. Check your connection and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, filter, refreshKey, setHasMore, setLoading, setPage, setPosts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setLoading(true);

    const request = activeTab === 'following'
      ? postService.getFollowingFeed({ page: nextPage, limit: LIMIT })
      : postService.getFeed({ page: nextPage, limit: LIMIT, ...filter });

    request
      .then(({ data }) => {
        const newPosts = data.data || [];
        appendPosts(hydrateViewerState(newPosts));
        if (activeTab === 'following') {
          setFollowingIds((current) => [
            ...new Set([...current, ...newPosts.map((post) => post.vendor?.id).filter(Boolean)]),
          ]);
        }
        setHasMore(newPosts.length === LIMIT);
        setPage(nextPage);
      })
      .catch(() => setFeedError('More stories could not be loaded. Please try again.'))
      .finally(() => setLoading(false));
  }, [activeTab, appendPosts, filter, hasMore, loading, page, setHasMore, setLoading, setPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [loadMore]);

  useSocketEvent('post:new', ({ post }) => {
    if (activeTab === 'following' && followingIds.length && !followingIds.includes(post.vendor?.id)) return;
    prependPost(post);
  });

  useEffect(() => {
    vendorService
      .getAll({ limit: 8 })
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {});
    productService
      .getAll({ limit: 8, sort: 'popular' })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {});
    categoryService
      .getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    setSearchParams(query ? { search: query } : {}, { replace: true });
  };

  const clearSearch = () => {
    setSearch('');
    setSearchParams({}, { replace: true });
  };

  const selectTab = (tab) => {
    if (tab.key === activeTab) return;

    if (tab.key === 'following') {
      if (!isAuthenticated) {
        openAuth('Sign in to see stories from kitchens you follow');
        return;
      }
      setActiveTab(tab.key);
      loadFollowingFeed();
      return;
    }

    setActiveTab(tab.key);
    setFilter({ type: tab.type, vendorId: '', search: search.trim() });
  };

  const retry = () => {
    setRefreshKey((value) => value + 1);
    if (activeTab === 'following') loadFollowingFeed();
  };

  const trendingTopics = useMemo(() => {
    const counts = new Map();
    posts.flatMap((post) => post.tags || []).forEach((tag) => {
      const key = String(tag).replace(/^#/, '').trim();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
    categories.forEach((category) => counts.set(category.name, (counts.get(category.name) || 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [categories, posts]);

  const timelineItems = useMemo(() => {
    const items = posts.map((post) => ({ type: 'post', post, key: post.id }));
    if (posts.length >= 4) {
      items.splice(4, 0, { type: 'vendors', key: `kitchens-${posts[3].id}` });
    }
    if (posts.length >= 9) {
      items.splice(9, 0, { type: 'dishes', key: `dishes-${posts[8].id}` });
    }
    return items;
  }, [posts]);

  const firstName = user?.firstName || 'food lover';

  return (
    <MainLayout>
      <div className="social-page-container page-container py-4 sm:py-6">
        <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,720px)_310px] xl:gap-6">
          <aside className="sticky top-24 hidden lg:block">
            <CommunityRail
              activeTab={activeTab}
              onSelectTab={selectTab}
              isAuthenticated={isAuthenticated}
              onSavedClick={() => {
                if (!isAuthenticated) {
                  openAuth('Sign in to view saved stories');
                  return;
                }
                navigate('/saved');
              }}
            />
          </aside>

          <main className="min-w-0">
            <FeedIntro
              firstName={firstName}
              search={search}
              setSearch={setSearch}
              onSearch={handleSearch}
              onClear={clearSearch}
              hasSearch={Boolean(urlSearch)}
              isAuthenticated={isAuthenticated}
            />

            <div className="mt-4 overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white shadow-card">
              <StoriesBar />
            </div>

            <div className="mt-4">
              <FeedComposer />
            </div>

            <div className="mb-5 flex items-center gap-1 overflow-x-auto border-b border-orange-100 scrollbar-hide" role="tablist" aria-label="Feed filters">
              {FEED_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => selectTab(tab)}
                  className={`relative flex-shrink-0 px-4 py-3 text-sm font-semibold transition-colors ${
                    activeTab === tab.key ? 'text-primary' : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.span
                      layoutId="feedTab"
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            {loading && posts.length === 0 ? (
              <div className="space-y-5">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : feedError ? (
              <FeedEmptyState
                icon={Compass}
                title="The kitchen is quiet for a moment"
                description={feedError}
                actionLabel="Try again"
                onAction={retry}
              />
            ) : posts.length === 0 ? (
              <FeedEmptyState
                icon={activeTab === 'following' ? Users : ChefHat}
                title={activeTab === 'following' ? 'Follow your first kitchen' : 'No stories here yet'}
                description={
                  activeTab === 'following'
                    ? 'Follow kitchens you love and their newest recipes, prep stories, and offers will appear here.'
                    : 'Try another filter or check back soon for something delicious.'
                }
                actionLabel={activeTab === 'following' ? 'Discover kitchens' : 'Back to For you'}
                onAction={() =>
                  activeTab === 'following' ? navigate('/vendors') : selectTab(FEED_TABS[0])
                }
              />
            ) : (
              <>
                <div className="space-y-5">
                  {timelineItems.map((item) => {
                    if (item.type === 'post') return <PostCard key={item.key} post={item.post} />;
                    if (item.type === 'vendors') {
                      return <KitchensDiscovery key={item.key} vendors={vendors.slice(0, 3)} />;
                    }
                    return <DishesDiscovery key={item.key} products={products.slice(0, 3)} />;
                  })}
                </div>

                <div ref={sentinelRef} className="h-4" aria-hidden="true" />

                {loading && hasMore && (
                  <div className="mt-5 space-y-5">
                    <PostSkeleton />
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <p className="py-7 text-center text-xs text-brand-muted">
                    You&apos;re all caught up. Fresh kitchen stories will appear here.
                  </p>
                )}
              </>
            )}
          </main>

          <aside className="sticky top-24 hidden xl:block">
            <CommunityRailRight
              vendors={vendors}
              products={products}
              topics={trendingTopics}
            />
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}

function FeedIntro({ firstName, search, setSearch, onSearch, onClear, hasSearch, isAuthenticated }) {
  return (
    <section className="mb-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your food community</p>
          <h1 className="font-poppins text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">See what local kitchens are cooking, sharing, and serving today.</p>
        </div>
        {isAuthenticated && (
          <div className="md:hidden">
            <NotificationDropdown />
          </div>
        )}
      </div>

      <form onSubmit={onSearch} className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search stories, recipes, and kitchens..."
          className="h-12 w-full rounded-2xl border border-orange-100 bg-white pl-11 pr-11 text-sm text-brand-dark shadow-card placeholder-brand-muted focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
        {hasSearch && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-brand-bg hover:text-brand-dark"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </form>
    </section>
  );
}

function CommunityRail({ activeTab, onSelectTab, isAuthenticated, onSavedClick }) {
  const items = [
    { label: 'For you', icon: Compass, active: activeTab === 'for-you', action: () => onSelectTab(FEED_TABS[0]) },
    { label: 'Following', icon: Users, active: activeTab === 'following', action: () => onSelectTab(FEED_TABS[1]) },
    { label: 'Discover', icon: Sparkles, to: '/discover' },
    { label: 'Kitchens', icon: Store, to: '/vendors' },
    { label: 'Saved stories', icon: Bookmark, action: onSavedClick },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[1.8rem] border border-orange-100 bg-white p-3 shadow-card">
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-muted">Community</p>
        <div className="space-y-1">
          {items.map(({ label, icon: Icon, to, active, action }) => {
            const content = (
              <>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${active ? 'bg-primary text-white' : 'bg-brand-bg text-primary'}`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">{label}</span>
              </>
            );
            const className = `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-brand-dark transition-colors hover:bg-brand-bg ${active ? 'bg-primary/5 text-primary' : ''}`;

            return to ? (
              <Link key={label} to={to} className={className}>{content}</Link>
            ) : (
              <button key={label} type="button" onClick={action} className={className}>{content}</button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.8rem] bg-brand-dark p-4 text-white shadow-card">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <Heart size={16} aria-hidden="true" />
        </div>
        <p className="font-poppins text-base font-bold">Keep the good stories close</p>
        <p className="mt-1 text-xs leading-relaxed text-white/65">
          {isAuthenticated
            ? 'Save recipes and follow the kitchens you want to hear from next.'
            : 'Create an account to save recipes and follow your favourite kitchens.'}
        </p>
        <button type="button" onClick={onSavedClick} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-light hover:text-white">
          {isAuthenticated ? 'View saved stories' : 'Get started'} <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

function CommunityRailRight({ vendors, products, topics }) {
  return (
    <div className="space-y-4">
      <SidebarCard title="Kitchens to follow" subtitle="Fresh from the community">
        <div className="space-y-3.5">
          {vendors.slice(0, 3).map((vendor) => (
            <div key={vendor.id} className="flex items-center gap-2.5">
              <Link to={`/vendors/${vendor.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                <Avatar src={vendor.logo || vendor.coverImage} alt={vendor.businessName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-dark">{vendor.businessName}</p>
                  <p className="truncate text-[11px] text-brand-muted">
                    {vendor.isOpen ? 'Open now' : vendor.address || 'Local kitchen'}
                  </p>
                </div>
              </Link>
              <FollowButton vendorId={vendor.id} size="sm" variant="outline" />
            </div>
          ))}
        </div>
        <Link to="/vendors" className="mt-4 flex items-center justify-center gap-1 border-t border-orange-50 pt-3 text-xs font-bold text-primary hover:underline">
          Explore kitchens <ChevronRight size={12} />
        </Link>
      </SidebarCard>

      <SidebarCard title="Trending conversations" subtitle="What the community is sharing">
        {topics.length ? (
          <div className="space-y-1">
            {topics.map(({ name, count }, index) => (
              <Link
                key={name}
                to={`/?search=${encodeURIComponent(name)}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-brand-bg"
              >
                <span className="w-5 text-xs font-bold text-brand-muted/60">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-dark">#{name}</span>
                <span className="text-[10px] text-brand-muted">{count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-muted">Follow kitchens and join a conversation to see topics here.</p>
        )}
      </SidebarCard>

      <SidebarCard title="Popular dishes" subtitle="Trending from local kitchens">
        <div className="space-y-3">
          {products.slice(0, 3).map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="group flex items-center gap-3">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120'}
                alt={product.name}
                className="h-11 w-11 rounded-xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-dark group-hover:text-primary">{product.name}</p>
                <p className="truncate text-[11px] text-brand-muted">{product.vendor?.businessName}</p>
              </div>
              <span className="text-xs font-bold text-primary">
                {formatPrice(Number(product.discountPrice) || Number(product.price))}
              </span>
            </Link>
          ))}
        </div>
      </SidebarCard>

      <div className="rounded-[1.8rem] border border-orange-100 bg-gradient-to-br from-primary/10 to-accent/10 p-4">
        <div className="flex items-center gap-2 text-primary">
          <MapPin size={15} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.14em]">Open now</p>
        </div>
        <p className="mt-2 text-sm font-semibold text-brand-dark">
          {vendors.filter((vendor) => vendor.isOpen).length || 'No'} kitchens are serving right now
        </p>
        <Link to="/vendors" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          See who is open <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function SidebarCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.8rem] border border-orange-100 bg-white p-4 shadow-card">
      <div className="mb-3">
        <h2 className="font-poppins text-base font-bold text-brand-dark">{title}</h2>
        <p className="mt-0.5 text-xs text-brand-muted">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function FeedEmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="surface-card px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h2 className="heading-section">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">{description}</p>
      <button type="button" onClick={onAction} className="btn-primary mt-6 inline-flex items-center gap-2">
        {actionLabel}
        <ChevronRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function KitchensDiscovery({ vendors }) {
  if (!vendors.length) return null;
  return (
    <section className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white to-orange-50 p-5 shadow-card">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">People to follow</p>
          <h2 className="mt-1 font-poppins text-xl font-bold text-brand-dark">Kitchens worth following</h2>
        </div>
        <Link to="/vendors" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          See all <ChevronRight size={13} />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {vendors.map((vendor) => (
          <Link key={vendor.id} to={`/vendors/${vendor.id}`} className="group rounded-3xl border border-orange-100 bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <img
              src={vendor.coverImage || vendor.logo || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300'}
              alt={vendor.businessName}
              className="mb-3 h-24 w-full rounded-2xl object-cover"
              loading="lazy"
            />
            <p className="truncate text-sm font-semibold text-brand-dark group-hover:text-primary">{vendor.businessName}</p>
            <p className="truncate text-xs text-brand-muted">{vendor.address || 'Homemade kitchen'}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DishesDiscovery({ products }) {
  if (!products.length) return null;
  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UtensilsCrossed size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-poppins text-lg font-bold text-brand-dark">Dishes everyone is talking about</h2>
            <p className="text-xs text-brand-muted">Tap a dish to see the full menu and order.</p>
          </div>
        </div>
        <Flame size={18} className="text-primary" aria-hidden="true" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {products.map((product) => (
          <Link key={product.id} to={`/products/${product.id}`} className="group rounded-3xl border border-orange-100 p-3 transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300'}
              alt={product.name}
              className="mb-3 h-24 w-full rounded-2xl object-cover"
              loading="lazy"
            />
            <p className="truncate text-sm font-semibold text-brand-dark group-hover:text-primary">{product.name}</p>
            <p className="mt-1 text-xs text-brand-muted">{product.vendor?.businessName}</p>
            <p className="mt-2 text-sm font-bold text-primary">{formatPrice(Number(product.discountPrice) || Number(product.price))}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Avatar({ src, alt }) {
  return src ? (
    <img src={src} alt={alt} className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" />
  ) : (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <ChefHat size={16} aria-hidden="true" />
    </span>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
