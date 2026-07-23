import { Link } from 'react-router-dom';
import { Compass, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import HomeTrending from '../../components/customer/HomeTrending';
import HomeRecommendations from '../../components/customer/HomeRecommendations';
import HomeNearbyVendors from '../../components/customer/HomeNearbyVendors';
import HomeCategories from '../../components/customer/HomeCategories';
import HomeClosingSoon from '../../components/customer/HomeClosingSoon';

/**
 * Discover — exploration hub (trending, collections, nearby, recommendations).
 * Not a Shop catalog clone.
 */
export default function DiscoverPage() {
  return (
    <MainLayout>
      <div className="page-container page-shell">
        <div className="mb-8">
          <p className="eyebrow mb-3">
            <Compass size={13} aria-hidden="true" />
            Explore
          </p>
          <h1 className="heading-page mb-2">Discover</h1>
          <p className="section-subtitle max-w-2xl">
            Trending plates, curated collections, nearby kitchens, and recommendations —
            explore what to try next, then jump into Shop when you&apos;re ready to buy.
          </p>
        </div>

        {/* Exploration shortcuts */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {[
            { to: '/shop', label: 'Shop marketplace', sub: 'Search & order food', icon: Sparkles },
            { to: '/vendors', label: 'Nearby kitchens', sub: 'Vendor directory', icon: MapPin },
            { to: '/', label: 'Food Feed', sub: 'Stories & posts', icon: Compass },
            { to: '/products?sort=popular', label: 'Trending menu', sub: 'Popular dishes', icon: ArrowRight },
          ].map(({ to, label, sub, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="surface-muted p-4 hover:border-primary/30 hover:bg-white transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={16} aria-hidden="true" />
              </div>
              <p className="font-semibold text-brand-dark text-sm">{label}</p>
              <p className="text-xs text-brand-muted mt-0.5">{sub}</p>
            </Link>
          ))}
        </div>

        {/* Lightweight “map / nearby” strip — reuses nearby vendor exploration */}
        <div className="surface-card p-5 sm:p-6 mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
            <div>
              <h2 className="heading-section flex items-center gap-2">
                <MapPin size={18} className="text-primary" aria-hidden="true" />
                Nearby & around you
              </h2>
              <p className="text-sm text-brand-muted mt-1">
                Explore kitchens close by — full map integrations can plug in here later.
              </p>
            </div>
            <Link to="/vendors" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              See all vendors <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4 h-36 rounded-[1.4rem] bg-gradient-to-br from-orange-50 via-brand-bg to-accent/10 border border-orange-100 flex items-center justify-center text-sm text-brand-muted">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-primary" aria-hidden="true" />
              Explore area · Lagos & nearby kitchens
            </span>
          </div>
        </div>
      </div>

      <HomeTrending />
      <HomeCategories />
      <HomeRecommendations />
      <HomeNearbyVendors />
      <HomeClosingSoon />

      <div className="page-container pb-12">
        <div className="surface-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="heading-section">Ready to order?</h2>
            <p className="text-sm text-brand-muted mt-1">Open the Shop marketplace for full search and filters.</p>
          </div>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            Go to Shop <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
