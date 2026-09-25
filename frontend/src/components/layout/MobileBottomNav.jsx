import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rss, Compass, ChefHat, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/', match: 'feed', icon: Rss, label: 'Feed' },
  { to: '/discover', match: 'discover', icon: Compass, label: 'Discover' },
  { to: '/vendors', match: 'vendors', icon: ChefHat, label: 'Kitchens' },
  { to: '/orders', match: 'orders', icon: ShoppingBag, label: 'Orders', requiresAuth: true },
  { to: '/profile', match: 'profile', icon: User, label: 'Me', requiresAuth: true },
];

const isNavActive = (match, pathname) => {
  if (match === 'feed') {
    return pathname === '/' || pathname.startsWith('/feed') || pathname.startsWith('/posts');
  }
  if (match === 'discover') return pathname.startsWith('/discover');
  if (match === 'vendors') return pathname.startsWith('/vendors');
  if (match === 'orders') return pathname.startsWith('/orders');
  if (match === 'profile') return pathname.startsWith('/profile');
  return false;
};

export default function MobileBottomNav() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/products/') ||
    location.pathname.startsWith('/cart') ||
    location.pathname.startsWith('/checkout')
  ) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-orange-100/80 bg-white/90 backdrop-blur-2xl safe-area-pb mobile-bottom-nav">
      <div className="mx-auto flex h-16 max-w-screen-sm items-center justify-around px-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.match, location.pathname);
          const to = item.requiresAuth && !isAuthenticated ? '/login' : item.to;

          return (
            <Link
              key={item.label}
              to={to}
              className="flex min-w-[58px] flex-col items-center gap-0.5 py-1"
              aria-current={active ? 'page' : undefined}
            >
              <motion.div whileTap={{ scale: 0.88 }} className="relative">
                <Icon
                  size={21}
                  className={`transition-colors ${active ? 'text-primary' : 'text-brand-muted'}`}
                  strokeWidth={active ? 2.5 : 1.9}
                />
                {active && (
                  <motion.div
                    layoutId="mobileNavActive"
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                  />
                )}
              </motion.div>
              <span className={`text-[10px] font-semibold ${active ? 'text-primary' : 'text-brand-muted'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
