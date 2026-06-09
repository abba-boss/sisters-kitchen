import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Star, Users, ShoppingBag } from 'lucide-react';

const SUGGESTIONS = ['Shawarma', 'Pizza', 'Jollof Rice', 'Cake', 'Burger', 'Smoothie'];

export default function HeroSection() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="relative overflow-hidden bg-hero-pattern">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

      <div className="page-container relative py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
                🍽️ Nigeria's #1 Homemade Food Marketplace
              </span>

              <h1 className="font-poppins font-bold text-4xl md:text-5xl lg:text-6xl text-brand-dark leading-tight mb-5">
                Real Food,<br />
                <span className="text-gradient">Real Mamas</span>,<br />
                Real Flavour
              </h1>

              <p className="text-brand-muted text-lg leading-relaxed mb-8 max-w-lg">
                Discover homemade meals from talented female vendors in your city. From Grandma's jollof to artisan cakes — order fresh, eat happy.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative mb-5 max-w-lg">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for food or vendors..."
                  className="input-field pl-12 pr-32 h-14 text-base shadow-card"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 mb-8">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => navigate(`/products?search=${s}`)}
                    className="text-xs font-medium px-3 py-1.5 bg-white rounded-full border border-orange-100 text-brand-muted hover:bg-primary hover:text-white hover:border-primary transition-all shadow-card"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/products')} className="btn-primary flex items-center gap-2">
                  Order Now <ChevronRight size={18} />
                </button>
                <button onClick={() => navigate('/register?role=vendor')} className="btn-secondary flex items-center gap-2">
                  Become a Vendor
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right image collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-3xl overflow-hidden h-52 shadow-card-hover">
                  <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400" alt="food" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-3xl overflow-hidden h-36 shadow-card-hover">
                  <img src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400" alt="burger" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-3xl overflow-hidden h-36 shadow-card-hover">
                  <img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" alt="cake" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-3xl overflow-hidden h-52 shadow-card-hover">
                  <img src="https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400" alt="smoothie" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Stats floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-card-hover p-4 flex gap-4"
            >
              {[
                { icon: Users, value: '500+', label: 'Vendors' },
                { icon: ShoppingBag, value: '10K+', label: 'Orders' },
                { icon: Star, value: '4.9', label: 'Rating' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center px-3">
                  <Icon size={18} className="text-primary mx-auto mb-1" />
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
