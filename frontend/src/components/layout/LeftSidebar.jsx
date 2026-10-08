import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  ShoppingBag, 
  Store, 
  MessageSquare,
  User,
  Package,
  ChefHat,
  Coins
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const CUSTOMER_NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/products', label: 'Discover', icon: Compass },
  { to: '/feed', label: 'Live Cooking', icon: ChefHat },
  { to: '/vendors', label: 'Vendors', icon: Store },
  { to: '/orders', label: 'Orders', icon: Package, authRequired: true },
  { to: '/rewards', label: 'Rewards', icon: Coins, authRequired: true },
  { to: '/messages', label: 'Messages', icon: MessageSquare, authRequired: true },
  { to: '/profile', label: 'Profile', icon: User, authRequired: true },
];

export default function LeftSidebar() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  const navItems = CUSTOMER_NAV.filter(item => 
    !item.authRequired || isAuthenticated
  );

  return (
    <aside className="hidden lg:flex flex-col h-[calc(100vh-80px)] sticky top-20 w-full">
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || 
                          (item.to !== '/' && location.pathname.startsWith(item.to));
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-primary text-white font-semibold' 
                  : 'text-brand-dark hover:bg-orange-50 hover:text-primary'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-brand-muted group-hover:text-primary'} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Become a Vendor CTA */}
      {isAuthenticated && user?.role === 'customer' && (
        <div className="p-4 bg-gradient-to-br from-primary to-orange-400 rounded-2xl text-white mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Store size={16} />
            </div>
            <h3 className="font-semibold text-sm">Become a Vendor</h3>
          </div>
          <p className="text-xs text-white/80 mb-3">Start selling your homemade food today</p>
          <Link 
            to="/register?role=vendor" 
            className="block w-full bg-white text-primary text-xs font-semibold py-2 rounded-lg text-center hover:bg-orange-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      )}
    </aside>
  );
}
