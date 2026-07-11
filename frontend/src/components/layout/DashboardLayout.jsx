import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Star, Settings,
  Bell, LogOut, Menu, X, ChefHat, Users, BarChart3,
  Store, TrendingUp, PlusSquare, CreditCard, Rss, Camera, Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from '../common/NotificationDropdown';

const vendorLinks = [
  { to: '/vendor/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/vendor/hub',          icon: Zap,             label: '✦ Business Hub'},
  { to: '/vendor/products',     icon: Package,         label: 'My Products'  },
  { to: '/vendor/posts',        icon: Rss,             label: 'Posts & Feed' },
  { to: '/vendor/stories',      icon: Camera,          label: 'Stories'      },
  { to: '/vendor/products/new', icon: PlusSquare,      label: 'Add Product'  },
  { to: '/vendor/orders',       icon: ShoppingBag,     label: 'Orders'       },
  { to: '/vendor/earnings',     icon: TrendingUp,      label: 'Earnings'     },
  { to: '/vendor/reviews',      icon: Star,            label: 'Reviews'      },
  { to: '/vendor/profile',      icon: Settings,        label: 'Store Profile'},
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/admin/analytics', icon: BarChart3,       label: 'Analytics'  },
  { to: '/admin/vendors',   icon: Store,            label: 'Vendors'    },
  { to: '/admin/users',     icon: Users,            label: 'Users'      },
  { to: '/admin/products',  icon: Package,          label: 'Products'   },
  { to: '/admin/orders',    icon: ShoppingBag,      label: 'Orders'     },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks : vendorLinks;
  const title = user?.role === 'admin' ? 'Admin Panel' : 'Vendor Panel';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-orange-100">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-soft">
            <ChefHat size={16} className="text-white" />
          </div>
          <div>
            <span className="font-poppins font-bold text-brand-dark text-sm">Sisters Kitchen</span>
            <p className="text-xs text-brand-muted">{title}</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to ||
            (to !== '/vendor/dashboard' && to !== '/admin/dashboard' && location.pathname.startsWith(to));
          return (
            <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-brand-muted hover:bg-brand-bg hover:text-brand-dark'
              }`}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-orange-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">{user?.firstName?.[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-dark truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-brand-muted capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  const currentLabel = links.find((l) =>
    location.pathname === l.to ||
    (l.to !== '/vendor/dashboard' && l.to !== '/admin/dashboard' && location.pathname.startsWith(l.to))
  )?.label || title;

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <a href="#dashboard-main" className="skip-link">Skip to main content</a>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white shadow-card flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-card-hover z-50 lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Topbar */}
        <header className="bg-white shadow-card px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl hover:bg-brand-bg text-brand-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-poppins font-semibold text-brand-dark text-base sm:text-lg truncate">
              {currentLabel}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <Link to="/" className="hidden sm:flex items-center gap-1.5 text-xs text-brand-muted hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-brand-bg">
              ← Site
            </Link>
          </div>
        </header>

        <main id="dashboard-main" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto page-shell !py-6 sm:!py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
