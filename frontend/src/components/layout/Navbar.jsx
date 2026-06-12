import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, User, Menu, X, Search,
  ChefHat, LogOut, Settings, Package, LayoutDashboard,
  CreditCard, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from '../common/NotificationDropdown';

const NAV_LINKS = [
  { to: '/',           label: 'Home'       },
  { to: '/products',   label: 'Browse Food'},
  { to: '/vendors',    label: 'Vendors'    },
];

export default function Navbar() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled,    setScrolled]    = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { logout }   = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const dropdownRef  = useRef(null);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin')  return '/admin/dashboard';
    if (user?.role === 'vendor') return '/vendor/dashboard';
    return '/profile';
  };

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-50 transition-shadow duration-200 ${scrolled ? 'shadow-card' : ''}`}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* ── Logo ─────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <ChefHat size={18} className="text-white" />
            </div>
            <span className="font-poppins font-bold text-lg text-brand-dark hidden sm:block">
              Sisters <span className="text-primary">Kitchen</span>
            </span>
          </Link>

          {/* ── Desktop nav ───────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-brand-muted hover:text-primary hover:bg-brand-bg'
                }`}>
                {label}
              </Link>
            ))}
          </div>

          {/* ── Actions ───────────────────────────────────── */}
          <div className="flex items-center gap-1.5">

            {/* Search toggle */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
              className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all"
              aria-label="Search">
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* Cart — visible to everyone (guests + logged in) */}
            <Link to="/cart" className="relative p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all" aria-label="Cart">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <Link to="/wishlist" className="hidden sm:flex p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all" aria-label="Wishlist">
                  <Heart size={20} />
                </Link>

                {/* Notifications */}
                <div className="hidden sm:block">
                  <NotificationDropdown />
                </div>

                {/* User menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-brand-bg transition-all"
                    aria-label="Account">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.avatar
                        ? <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                        : <span className="text-primary font-bold text-sm">{user?.firstName?.[0]}</span>
                      }
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-brand-dark max-w-[100px] truncate">
                      {user?.firstName}
                    </span>
                    <ChevronDown size={14} className={`hidden lg:block text-brand-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0,  scale: 1    }}
                        exit={  { opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 mt-2 w-54 bg-white rounded-2xl shadow-card-hover border border-orange-50 overflow-hidden z-50">

                        {/* User info */}
                        <div className="px-4 py-3 border-b border-orange-50">
                          <p className="font-semibold text-brand-dark text-sm">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-brand-muted capitalize">{user?.role}</p>
                        </div>

                        {/* Links */}
                        <div className="p-2">
                          {[
                            { to: getDashboardLink(), icon: LayoutDashboard, label: 'Dashboard' },
                            { to: '/orders',          icon: Package,         label: 'My Orders' },
                            { to: '/payments',        icon: CreditCard,      label: 'Payments'  },
                            { to: '/profile',         icon: Settings,        label: 'Profile'   },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-dark hover:bg-brand-bg transition-colors">
                              <Icon size={15} className="text-primary" />
                              {label}
                            </Link>
                          ))}
                          <div className="border-t border-orange-50 mt-1 pt-1">
                            <button onClick={logout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
                              <LogOut size={15} /> Logout
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden sm:block text-sm font-semibold text-brand-dark hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-brand-bg">
                  Login
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-brand-bg text-brand-muted transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Search bar slide-in ───────────────────────── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden pb-3">
              <form onSubmit={handleSearch} className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Search for food, vendors, categories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="input-field pl-11 pr-4 h-12 text-base shadow-card"
                />
                {searchQuery && (
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-xl hover:bg-primary-dark transition-colors">
                    Search
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile menu ───────────────────────────────── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="md:hidden overflow-hidden border-t border-orange-50 py-3 space-y-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to) ? 'bg-primary/10 text-primary' : 'text-brand-dark hover:bg-brand-bg'
                  }`}>
                  {label}
                </Link>
              ))}
              {/* Cart always visible in mobile menu */}
              <Link to="/cart"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-brand-dark hover:bg-brand-bg">
                <span>🛒 Cart</span>
                {totalItems > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/wishlist"      className="block px-3 py-2.5 rounded-xl text-sm font-medium text-brand-dark hover:bg-brand-bg">❤️ Wishlist</Link>
                  <Link to="/notifications" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-brand-dark hover:bg-brand-bg">🔔 Notifications</Link>
                  <button onClick={logout} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login"    className="btn-secondary flex-1 text-center text-sm py-2">Login</Link>
                  <Link to="/register" className="btn-primary  flex-1 text-center text-sm py-2">Sign Up</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
