import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Rss, Compass, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/products?discover=1', match: '/products', icon: Compass, label: 'Discover' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders', authOnly: true },
  { to: '/profile', icon: User, label: 'Profile', authOnly: true },
];

export default function MobileBottomNav() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin')) return null;

  const isActive = (item) => {
    const match = item.match || item.to;
    if (match === '/') return location.pathname === '/';
    return location.pathname.startsWith(match);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/86 backdrop-blur-2xl border-t border-orange-100 safe-area-pb">
      <div className="max-w-screen-sm mx-auto px-2 h-16 flex items-center justify-around">
        {NAV.filter((item) => (item.authOnly ? isAuthenticated : true)).map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
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
