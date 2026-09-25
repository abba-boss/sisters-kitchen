import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  Compass,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import FollowButton from '../../components/social/FollowButton';
import { productService } from '../../services/productService';
import { vendorService } from '../../services/vendorService';
import { categoryService } from '../../services/categoryService';
import { formatPrice } from '../../utils/formatters';

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productService
      .getAll({ sort: 'popular', limit: 8 })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {});
    vendorService
      .getAll({ limit: 8 })
      .then(({ data }) => setVendors(data.data || []))
      .catch(() => {});
    categoryService
      .getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const nearbyKitchens = useMemo(() => {
    const cityKeys = ['lagos', 'abuja', 'kano', 'port harcourt', 'ibadan', 'kaduna'];
    const nearby = vendors.filter((vendor) =>
      cityKeys.some((key) => (vendor.address || '').toLowerCase().includes(key))
    );
    return (nearby.length ? nearby : vendors).slice(0, 6);
  }, [vendors]);

  const handleSearch = (event) => {
    event.preventDefault();
    const search = query.trim();
    if (search) navigate(`/?search=${encodeURIComponent(search)}`);
  };

  return (
    <MainLayout>
      <div className="social-page-container page-container py-7 sm:py-10">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-brand-dark px-5 py-10 text-white shadow-card-hover sm:px-10 sm:py-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
              <Sparkles size={13} aria-hidden="true" />
              Discover your next food obsession
            </p>
            <h1 className="max-w-2xl font-poppins text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Find a kitchen. Follow the story. Crave the dish.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              Explore recipes, prep videos, new menus, and women-led kitchens sharing the food they are proud to serve.
            </p>

            <form onSubmit={handleSearch} className="relative mt-7 max-w-xl">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the feed for jollof, pastries, Lagos..."
                className="h-13 w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-28 text-sm text-brand-dark shadow-card-hover placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-white/20"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
                Search
              </button>
            </form>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Explore Sisters Kitchen">
          <DiscoverLink
            to="/"
            icon={Compass}
            title="Food feed"
            description="See what kitchens are sharing now"
          />
          <DiscoverLink
            to="/vendors"
            icon={Store}
            title="Find a kitchen"
            description="Follow local cooks and creators"
          />
          <DiscoverLink
            to="/saved"
            icon={Bookmark}
            title="Saved stories"
            description="Keep recipes and inspiration close"
          />
        </section>

        {categories.length > 0 && (
          <section className="mt-10">
            <SectionHeading
              eyebrow="Browse by craving"
              title="What are you in the mood for?"
              description="Jump into the stories and dishes people are sharing."
            />
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="flex min-w-[104px] flex-col items-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
                >
                  <span className="text-2xl" aria-hidden="true">{category.icon || '🍽️'}</span>
                  <span className="text-xs font-semibold text-brand-dark">{category.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <SectionHeading
            eyebrow="Trending plates"
            title="Dishes worth talking about"
            description="Open a dish when you are ready to see the menu and order."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/products/${product.id}`}
                  className="group block h-full overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500'}
                    alt={product.name}
                    className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="p-4">
                    <p className="line-clamp-1 font-poppins font-bold text-brand-dark group-hover:text-primary">{product.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-brand-muted">{product.vendor?.businessName}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-muted">
                        <Star size={12} className="text-primary" fill="currentColor" />
                        {Number(product.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(Number(product.discountPrice) || Number(product.price))}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Local community"
              title="Kitchens cooking near you"
              description="Follow a kitchen to see its stories, menu drops, and opening updates."
            />
            <Link to="/vendors" className="mb-1 hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyKitchens.map((vendor) => (
              <article key={vendor.id} className="overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white shadow-card">
                <Link to={`/vendors/${vendor.id}`}>
                  <img
                    src={vendor.coverImage || vendor.logo || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500'}
                    alt={vendor.businessName}
                    className="h-36 w-full object-cover"
                    loading="lazy"
                  />
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/vendors/${vendor.id}`} className="line-clamp-1 font-poppins font-bold text-brand-dark hover:text-primary">
                        {vendor.businessName}
                      </Link>
                      <p className="mt-1 line-clamp-1 text-xs text-brand-muted">{vendor.address || 'Homemade kitchen'}</p>
                    </div>
                    <FollowButton vendorId={vendor.id} size="sm" variant="outline" />
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-muted">
                    <MapPin size={11} className="text-primary" />
                    {vendor.isOpen ? 'Open now' : 'Check today’s hours'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

function DiscoverLink({ to, icon: Icon, title, description }) {
  return (
    <Link to={to} className="group surface-muted flex items-center gap-3 p-4 transition-all hover:border-primary/30 hover:bg-white hover:shadow-soft">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-dark">{title}</span>
        <span className="mt-0.5 block text-xs text-brand-muted">{description}</span>
      </span>
      <ArrowRight size={15} className="text-brand-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-1 font-poppins text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-brand-muted">{description}</p>
    </div>
  );
}
