import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronDown, Flame, Heart, Clock, Star, Truck, Store, TrendingUp } from 'lucide-react';
import { productService } from '../../services/productService';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../utils/formatters';

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening'];
const LOCATIONS  = ['Kano, Nigeria', 'Lagos, Nigeria', 'Abuja, Nigeria', 'Port Harcourt'];
const HERO_IMAGE = 'https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=900';

const QUICK_SEARCHES = ['Jollof Rice', 'Shawarma', 'Burger', 'Pizza', 'Cake', 'Suya', 'Smoothie', 'Puff Puff'];
const SEARCH_PLACEHOLDERS = [
  'Search for smoky jollof, shawarma, cakes...',
  'Find vendors near you or dishes you love...',
  'Craving fresh food? Search homemade meals...',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 17) return GREETINGS[1];
  return GREETINGS[2];
}

export default function HomeHero() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const [query,       setQuery]       = useState('');
  const [focused,     setFocused]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [location,    setLocation]    = useState(LOCATIONS[0]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sk-recent-searches') || '[]');
      if (Array.isArray(saved)) setRecentSearches(saved.slice(0, 5));
    } catch {}
  }, []);

  // Keyboard shortcut: /  → focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Live suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      productService.getAll({ search: query, limit: 4 })
        .then(({ data }) => setSuggestions(data.data || []))
        .catch(() => {});
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    const normalized = query.trim();
    try {
      const next = [normalized, ...recentSearches.filter((s) => s.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
      setRecentSearches(next);
      localStorage.setItem('sk-recent-searches', JSON.stringify(next));
    } catch {}
    navigate(`/products?search=${encodeURIComponent(normalized)}`);
    setFocused(false);
  };

  const greeting  = getGreeting();
  const firstName = user?.firstName || 'Friend';
  const heroBadges = useMemo(() => ([
    { icon: Store, label: 'Vendor Pick', className: 'top-4 left-4' },
    { icon: Star, label: '4.9 Rated', className: 'top-5 right-5' },
    { icon: Flame, label: 'Fresh Today', className: 'bottom-24 left-5' },
    { icon: TrendingUp, label: 'Trending', className: 'bottom-24 right-5' },
    { icon: Truck, label: '24-35 min', className: 'bottom-5 right-8' },
  ]), []);

  return (
    <section className="relative bg-[#FFF6EE] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-orange-200/30 blur-3xl" />
      </div>
      {/* ── Full-bleed hero layout ───────────────────── */}
      <div className="page-container relative pt-8 pb-10 md:pt-12 md:pb-14">
        <div className="grid lg:grid-cols-[1fr_500px] gap-8 xl:gap-12 items-center">

          {/* ── Left ─────────────────────────────────── */}
          <div>
            {/* Location picker */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                const idx = LOCATIONS.indexOf(location);
                setLocation(LOCATIONS[(idx + 1) % LOCATIONS.length]);
              }}
              className="flex items-center gap-1.5 text-sm text-brand-muted mb-4 hover:text-primary transition-colors"
            >
              <MapPin size={14} className="text-primary" />
              <span className="font-medium">{location}</span>
              <ChevronDown size={13} />
            </motion.button>

            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="font-poppins font-bold text-4xl sm:text-5xl xl:text-6xl text-brand-dark leading-[1.05] mb-2">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-brand-muted text-base sm:text-lg mb-6 max-w-xl">
                Discover beautifully made homemade meals, social food stories, and fast-moving cravings near you.
              </p>
            </motion.div>

            {/* ── Search bar ───────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="relative max-w-xl"
            >
              <form onSubmit={handleSearch}>
                <div className={`flex items-center bg-white/92 backdrop-blur-sm rounded-full border border-orange-100 shadow-card transition-all duration-300 ${focused ? 'ring-4 ring-primary/15 border-primary/30 shadow-card-hover -translate-y-0.5' : 'hover:shadow-card-hover'}`}>
                  <Search size={18} className="ml-5 text-brand-muted flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 160)}
                    placeholder={SEARCH_PLACEHOLDERS[placeholderIdx]}
                    className="flex-1 bg-transparent px-3 py-4 text-sm sm:text-[15px] text-brand-dark placeholder-brand-muted focus:outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.03 }}
                    type="submit"
                    className="m-1.5 bg-primary text-white px-4 sm:px-5 h-11 rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors flex-shrink-0 text-sm font-semibold shadow-soft"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <Search size={16} className="sm:hidden" />
                  </motion.button>
                </div>
              </form>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {focused && (suggestions.length > 0 || !query) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={  { opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-card-hover border border-orange-100 z-30 overflow-hidden"
                  >
                    {/* Recent + Popular */}
                    {!query && (
                      <div className="p-4 border-b border-orange-50">
                        {recentSearches.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-brand-muted mb-2 px-1">Recent searches</p>
                            <div className="flex flex-wrap gap-1.5">
                              {recentSearches.map((s) => (
                                <button
                                  key={s}
                                  onMouseDown={() => { setQuery(s); navigate(`/products?search=${encodeURIComponent(s)}`); }}
                                  className="text-xs font-medium px-3 py-1.5 bg-white border border-orange-100 rounded-full text-brand-dark hover:border-primary hover:text-primary transition-all"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-brand-muted mb-2 px-1">Popular searches</p>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_SEARCHES.map((s) => (
                            <button key={s} onMouseDown={() => { setQuery(s); navigate(`/products?search=${encodeURIComponent(s)}`); }}
                              className="text-xs font-medium px-3 py-1.5 bg-brand-bg rounded-full text-brand-muted hover:bg-primary hover:text-white transition-all">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product suggestions */}
                    {suggestions.map((p) => (
                      <button key={p.id} onMouseDown={() => navigate(`/products/${p.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-bg transition-colors text-left">
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=60'}
                          alt={p.name} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                          <p className="text-xs text-brand-muted truncate">{p.vendor?.businessName}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary flex-shrink-0">{formatPrice(p.discountPrice||p.price)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {QUICK_SEARCHES.slice(0, 5).map((item) => (
                <button
                  key={item}
                  onClick={() => navigate(`/products?search=${encodeURIComponent(item)}`)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-orange-100 text-brand-muted hover:text-primary hover:border-primary/40 transition-all"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right — hero food image ───────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1  }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative rounded-[2rem] overflow-hidden hidden sm:block shadow-[0_20px_60px_rgba(74,44,42,0.14)]"
            style={{ height: 420 }}
          >
            <img src={HERO_IMAGE} alt="Featured food"
              className="w-full h-full object-cover scale-[1.02]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark/35 via-transparent to-white/10" />

            {heroBadges.map(({ icon: Icon, label, className }, idx) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                transition={{
                  opacity: { delay: 0.25 + idx * 0.12, duration: 0.35 },
                  y: { delay: 0.8 + idx * 0.05, duration: 3.2 + idx * 0.2, repeat: Infinity, ease: 'easeInOut' },
                }}
                className={`absolute ${className} bg-white/82 backdrop-blur-md border border-white/60 rounded-2xl px-3 py-2 shadow-card`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={14} />
                  </span>
                  <span className="text-xs font-semibold text-brand-dark">{label}</span>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72 }}
              className="absolute left-5 bottom-5 rounded-[1.4rem] bg-white/88 backdrop-blur-md border border-white/60 px-4 py-3 shadow-card max-w-[240px]"
            >
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-muted mb-1">Chef spotlight</p>
              <p className="font-poppins font-semibold text-brand-dark">Mama Ngozi&apos;s Kitchen</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-brand-muted">
                <span className="flex items-center gap-1"><Star size={11} className="text-primary" fill="#FF7A59" /> 4.9</span>
                <span className="flex items-center gap-1"><Truck size={11} className="text-primary" /> 24 mins</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
