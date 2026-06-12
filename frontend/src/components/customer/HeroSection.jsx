import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Star, ShoppingBag, Store } from 'lucide-react';
import CategoryCarousel from './CategoryCarousel';
import { statsService } from '../../services/statsService';

const FOOD_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1567364347001-01d1d33b9a78?w=500', alt: 'Jollof Rice' },
  { src: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500', alt: 'Burger' },
  { src: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500', alt: 'Cake' },
  { src: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500', alt: 'Shawarma' },
];

export default function HeroSection() {
  const [query, setQuery]   = useState('');
  const [stats, setStats]   = useState({ vendors: null, products: null, rating: null });
  const navigate = useNavigate();

  useEffect(() => {
    statsService.getPublic()
      .then(({ data }) => {
        const d = data.data;
        setStats({
          vendors:  d.vendors,
          products: d.products,
          rating:   d.avgRating > 0 ? d.avgRating.toFixed(1) : null,
        });
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const statCards = [
    { icon: Store,       value: stats.vendors  != null ? `${stats.vendors}+`  : '…', label: 'Vendors'    },
    { icon: ShoppingBag, value: stats.products != null ? `${stats.products}+` : '…', label: 'Dishes'     },
    { icon: Star,        value: stats.rating   ?? '…',                              label: 'Avg Rating' },
  ];

  return (
    <section className="relative overflow-hidden bg-hero-pattern">
      {/* Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72  h-72  bg-accent/10  rounded-full blur-3xl pointer-events-none" />

      <div className="page-container relative py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* ── Left copy ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 0.55 }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1  }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-5"
            >
              🍽️ Nigeria's Homemade Food Marketplace
            </motion.span>

            <h1 className="font-poppins font-bold text-4xl md:text-5xl lg:text-6xl text-brand-dark leading-tight mb-5">
              Real Food,<br />
              <span className="text-gradient">Real Sisters</span>,<br />
              Real Flavour
            </h1>

            <p className="text-brand-muted text-lg leading-relaxed mb-8 max-w-lg">
              Discover fresh meals, baked goods, and culinary creations from talented female vendors in your city.
              Order with ease and enjoy every bite.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative mb-5 max-w-lg">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for food or vendors…"
                className="input-field pl-12 pr-32 h-14 text-base shadow-card"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Search
              </button>
            </form>

            {/* Categories — auto-scroll pills in banner */}
            <div className="mb-8 max-w-lg">
              <p className="text-xs font-semibold text-brand-muted mb-2.5">Browse by Category</p>
              <CategoryCarousel variant="hero" />
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/products')} className="btn-primary flex items-center gap-2">
                Order Now <ChevronRight size={18} />
              </button>
              <button onClick={() => navigate('/register?role=vendor')} className="btn-secondary flex items-center gap-2">
                Become a Vendor
              </button>
            </div>

            {/* Live stats — visible on mobile/tablet */}
            <div className="lg:hidden mt-8 grid grid-cols-3 gap-3">
              {statCards.map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-white rounded-2xl shadow-card px-3 py-3 text-center">
                  <Icon size={16} className="text-primary mx-auto mb-1" />
                  <p className="font-poppins font-bold text-brand-dark text-sm">{value}</p>
                  <p className="text-[10px] text-brand-muted leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Right image collage ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1  }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-3xl overflow-hidden h-52 shadow-card-hover">
                  <img src={FOOD_IMAGES[0].src} alt={FOOD_IMAGES[0].alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="rounded-3xl overflow-hidden h-40 shadow-card-hover">
                  <img src={FOOD_IMAGES[1].src} alt={FOOD_IMAGES[1].alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
              <div className="space-y-4 pt-10">
                <div className="rounded-3xl overflow-hidden h-40 shadow-card-hover">
                  <img src={FOOD_IMAGES[2].src} alt={FOOD_IMAGES[2].alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="rounded-3xl overflow-hidden h-52 shadow-card-hover">
                  <img src={FOOD_IMAGES[3].src} alt={FOOD_IMAGES[3].alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </div>

            {/* Live stats floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.9 }}
              className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-card-hover px-5 py-4 flex gap-5"
            >
              {statCards.map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <Icon size={17} className="text-primary mx-auto mb-1" />
                  <p className="font-poppins font-bold text-brand-dark text-sm">{value}</p>
                  <p className="text-xs text-brand-muted">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
