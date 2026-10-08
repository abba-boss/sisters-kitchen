import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Rss, Store, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/products', icon: Compass, label: 'Discover' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/vendors', icon: Store, label: 'Vendors' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-orange-100">
      <div className="max-w-screen-sm mx-auto grid grid-cols-5 h-16">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === '/' 
            ? location.pathname === '/' || location.pathname === '/shop'
            : location.pathname.startsWith(item.to);

          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className="flex flex-col items-center justify-center relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                size={22}
                className={`mb-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-brand-muted'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-brand-muted'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
