import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Search,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
  Coins,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from '../common/NotificationDropdown';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useAuthStore();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'vendor') return '/vendor/dashboard';
    return '/profile';
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      }`}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-poppins font-bold text-xl text-brand-dark">Sisters</span>
              <span className="font-poppins font-bold text-xl text-primary ml-1">Kitchen</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                placeholder="Search for food, vendors, dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 rounded-xl bg-brand-bg border border-orange-100 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery('');
                  }
                }}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search - Mobile */}
            <button
              onClick={() => navigate('/products')}
              className="md:hidden w-10 h-10 flex items-center justify-center text-brand-muted hover:text-primary transition-colors"
            >
              <Search size={20} />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="hidden sm:flex w-10 h-10 items-center justify-center text-brand-muted hover:text-primary transition-colors relative"
              >
                <Heart size={20} />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="w-10 h-10 flex items-center justify-center text-brand-muted hover:text-primary transition-colors relative"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {isAuthenticated && <NotificationDropdown />}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-bg transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-semibold text-sm">
                        {user?.firstName?.[0]}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`hidden sm:block text-brand-muted transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-orange-100 py-2 overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-orange-100">
                        <p className="font-semibold text-brand-dark">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-brand-muted">{user?.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <LayoutDashboard size={18} className="text-brand-muted" />
                          <span className="text-sm text-brand-dark">Dashboard</span>
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Package size={18} className="text-brand-muted" />
                          <span className="text-sm text-brand-dark">My Orders</span>
                        </Link>
                        <Link
                          to="/rewards"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Coins size={18} className="text-brand-muted" />
                          <span className="text-sm text-brand-dark">Rewards</span>
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Settings size={18} className="text-brand-muted" />
                          <span className="text-sm text-brand-dark">Settings</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-orange-100 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut size={18} className="text-red-500" />
                          <span className="text-sm text-red-500 font-semibold">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-brand-dark hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
