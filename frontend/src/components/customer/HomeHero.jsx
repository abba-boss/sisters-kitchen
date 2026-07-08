import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronDown, Flame, Heart, Clock } from 'lucide-react';
import { productService } from '../../services/productService';
import { vendorService } from '../../services/vendorService';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../utils/formatters';

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening'];
const LOCATIONS  = ['Kano, Nigeria', 'Lagos, Nigeria', 'Abuja, Nigeria', 'Port Harcourt'];
const HERO_IMAGE = 'https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=900';

const QUICK_SEARCHES = ['Jollof Rice', 'Shawarma', 'Burger', 'Pizza', 'Cake', 'Suya', 'Smoothie', 'Puff Puff'];

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
  const inputRef = useRef(null);

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
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setFocused(false);
  };

  const greeting  = getGreeting();
  const firstName = user?.firstName || 'Friend';

  return (
    <section className="relative bg-[#FFF6EE] overflow-hidden">
      {/* ── Full-bleed hero layout ───────────────────── */}
      <div className="page-container pt-8 pb-10 md:pt-12 md:pb-14">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-center">

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
              <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-brand-dark leading-tight mb-1">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-brand-muted text-base mb-6">What are you craving today?</p>
            </motion.div>

            {/* ── Search bar ───────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="relative max-w-xl"
            >
              <form onSubmit={handleSearch}>
                <div className={`flex items-center bg-white rounded-2xl shadow-card transition-all duration-300 ${focused ? 'ring-2 ring-primary/40 shadow-soft' : 'hover:shadow-card-hover'}`}>
                  <Search size={18} className="ml-4 text-brand-muted flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 160)}
                    placeholder="Search for food, vendors, or dishes..."
                    className="flex-1 bg-transparent px-3 py-4 text-sm text-brand-dark placeholder-brand-muted focus:outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    type="submit"
                    className="m-1.5 bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary-dark transition-colors flex-shrink-0"
                  >
                    <Search size={16} />
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
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card-hover border border-orange-50 z-30 overflow-hidden"
                  >
                    {/* Quick chips */}
                    {!query && (
                      <div className="p-3 border-b border-orange-50">
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
                          alt={p.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
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
          </div>

          {/* ── Right — hero food image ───────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1  }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative rounded-3xl overflow-hidden hidden sm:block"
            style={{ height: 260 }}
          >
            <img src={HERO_IMAGE} alt="Featured food"
              className="w-full h-full object-cover" />

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0  }}
              transition={{ delay: 0.5 }}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-card text-center"
            >
              <p className="text-xs font-bold text-brand-dark">Freshly made</p>
              <p className="text-xs text-primary font-semibold">With love ❤️</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.65 }}
              className="absolute bottom-4 left-4 flex gap-2"
            >
              <span className="flex items-center gap-1 bg-accent text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow">
                <Flame size={11} /> Fresh Today
              </span>
              <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-brand-dark text-xs font-semibold px-2.5 py-1.5 rounded-full shadow">
                <Clock size={11} className="text-primary" /> Open Now
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
