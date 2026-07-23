import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Menu,
  X,
  Search,
  ChefHat,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
  CreditCard,
  ChevronDown,
  Coins,
  Compass,
  Rss,
  Store,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useRewardStore } from '../../store/rewardStore';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from '../common/NotificationDropdown';

const DESKTOP_NAV = [
  { to: '/', label: 'Feed', match: 'feed' },
  { to: '/shop', label: 'Shop', match: 'shop' },
  { to: '/discover', label: 'Discover', match: 'discover' },
  { to: '/vendors', label: 'Vendors', match: 'vendors' },
];

const MOBILE_MENU_NAV = [
  ...DESKTOP_NAV,
  { to: '/wishlist', label: 'Wishlist', match: 'wishlist', authOnly: true },
  { to: '/cart', label: 'Cart', match: 'cart' },
  { to: '/notifications', label: 'Notifications', match: 'notifications', authOnly: true },
  { to: '/profile', label: 'Profile', match: 'profile', authOnly: true },
];

const isNavActive = (match, pathname) => {
  if (match === 'feed') {
    return pathname === '/' || pathname.startsWith('/feed') || pathname.startsWith('/posts');
  }
  if (match === 'shop') {
    return pathname === '/shop' || pathname.startsWith('/products');
  }
  if (match === 'discover') {
    return pathname.startsWith('/discover');
  }
  if (match === 'vendors') {
    return pathname.startsWith('/vendors');
  }
  return pathname.startsWith(`/${match}`);
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const balance = useRewardStore((s) => s.balance);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname, location.search]);

  const isActive = (match) => isNavActive(match, location.pathname);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/products?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const goToDiscover = () => navigate('/discover');

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'vendor') return '/vendor/dashboard';
    return '/profile';
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/72 backdrop-blur-2xl border-b border-orange-100/80 shadow-[0_10px_35px_rgba(74,44,42,0.08)]'
          : 'bg-white/95 border-b border-orange-50'
      }`}
    >
      <div className="page-container">
        <div className="h-[74px] flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <ChefHat size={18} className="text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="font-poppins font-bold text-base text-brand-dark">Sisters Kitchen</p>
              <p className="text-[11px] text-brand-muted">Homemade Social Commerce</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 mx-auto p-1 rounded-2xl bg-orange-50/70 border border-orange-100">
            {DESKTOP_NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive(item.match)
                    ? 'bg-white text-primary shadow-soft'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-white/80'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                setSearchQuery('');
              }}
              className="p-2.5 rounded-xl text-brand-muted hover:text-primary hover:bg-brand-bg transition-all"
              aria-label="Search"
            >
              {searchOpen ? <X size={19} /> : <Search size={19} />}
            </button>

            <button
              onClick={goToDiscover}
              className="hidden md:flex p-2.5 rounded-xl text-brand-muted hover:text-primary hover:bg-brand-bg transition-all"
              aria-label="Discover"
            >
              <Compass size={19} />
            </button>

            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-brand-muted hover:text-primary hover:bg-brand-bg transition-all"
              aria-label="Cart"
            >
              <ShoppingCart size={19} />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/wishlist"
                  className="hidden md:flex p-2.5 rounded-xl text-brand-muted hover:text-primary hover:bg-brand-bg transition-all"
                  aria-label="Wishlist"
                >
                  <Heart size={19} />
                </Link>

                <div className="hidden md:block">
                  <NotificationDropdown />
                </div>

                {balance > 0 && (
                  <Link
                    to="/rewards"
                    className="hidden xl:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                    title="Rewards"
                  >
                    🪙 {Math.floor(balance)}
                  </Link>
                )}

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-2xl hover:bg-brand-bg transition-all"
                    aria-label="Profile"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-sm">{user?.firstName?.[0] || 'U'}</span>
                      )}
                    </div>
                    <ChevronDown
                      size={13}
                      className={`text-brand-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 rounded-2xl border border-orange-100 bg-white/95 backdrop-blur-xl shadow-card-hover overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-orange-50">
                          <p className="font-semibold text-sm text-brand-dark truncate">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-brand-muted capitalize">{user?.role}</p>
                        </div>

                        <div className="p-2">
                          {[
                            { to: getDashboardLink(), icon: LayoutDashboard, label: 'Dashboard' },
                            { to: '/orders', icon: Package, label: 'My Orders' },
                            { to: '/', icon: Rss, label: 'Feed' },
                            { to: '/shop', icon: ShoppingBag, label: 'Shop' },
                            { to: '/discover', icon: Compass, label: 'Discover' },
                            { to: '/vendors', icon: Store, label: 'Vendors' },
                            { to: '/payments', icon: CreditCard, label: 'Payments' },
                            { to: '/profile', icon: Settings, label: 'Profile' },
                            { to: '/rewards', icon: Coins, label: 'Rewards' },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link
                              key={to + label}
                              to={to}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-dark hover:bg-brand-bg transition-colors"
                            >
                              <Icon size={15} className="text-primary" />
                              {label}
                            </Link>
                          ))}
                          <div className="mt-1 pt-1 border-t border-orange-50">
                            <button
                              onClick={logout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <LogOut size={15} />
                              Logout
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2 pl-1">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-dark hover:text-primary hover:bg-brand-bg transition-all"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm rounded-xl">
                  Register
                </Link>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-xl text-brand-muted hover:text-primary hover:bg-brand-bg transition-all"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden pb-4"
            >
              <form onSubmit={handleSearch} className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Search food, vendors, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="input-field h-12 pl-11 pr-24 text-base bg-white/95 border-orange-100 shadow-card"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="lg:hidden overflow-hidden border-t border-orange-100 py-3"
            >
              <div className="grid grid-cols-2 gap-2">
                {MOBILE_MENU_NAV.filter((item) => (item.authOnly ? isAuthenticated : true)).map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive(item.match) ? 'bg-primary/10 text-primary' : 'bg-brand-bg/60 text-brand-dark'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="mt-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Link to="/login" className="btn-secondary flex-1 text-center text-sm py-2">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary flex-1 text-center text-sm py-2">
                    Register
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
