import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rss, Store, Compass, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/', match: 'feed', icon: Rss, label: 'Feed' },
  { to: '/shop', match: 'shop', icon: Store, label: 'Shop' },
  { to: '/discover', match: 'discover', icon: Compass, label: 'Discover' },
  { to: '/orders', match: 'orders', icon: ShoppingBag, label: 'Orders', authOnly: true },
  { to: '/profile', match: 'profile', icon: User, label: 'Profile', authOnly: true },
];

const isNavActive = (match, pathname) => {
  if (match === 'feed') {
    return pathname === '/' || pathname.startsWith('/feed') || pathname.startsWith('/posts');
  }
  if (match === 'shop') {
    return pathname === '/shop' || pathname.startsWith('/products');
  }
  if (match === 'discover') return pathname.startsWith('/discover');
  if (match === 'orders') return pathname.startsWith('/orders');
  if (match === 'profile') return pathname.startsWith('/profile');
  return false;
};

export default function MobileBottomNav() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/86 backdrop-blur-2xl border-t border-orange-100 safe-area-pb mobile-bottom-nav">
      <div className="max-w-screen-sm mx-auto px-2 h-16 flex items-center justify-around">
        {NAV.filter((item) => (item.authOnly ? isAuthenticated : true)).map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.match, location.pathname);
          const to = item.authOnly && !isAuthenticated ? '/login' : item.to;

          return (
            <Link key={item.label} to={to} className="min-w-[58px] py-1 flex flex-col items-center gap-0.5">
              <motion.div whileTap={{ scale: 0.88 }} className="relative">
                <Icon
                  size={21}
                  className={`transition-colors ${active ? 'text-primary' : 'text-brand-muted'}`}
                  strokeWidth={active ? 2.5 : 1.9}
                />
                {active && (
                  <motion.div
                    layoutId="mobileNavActive"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
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
