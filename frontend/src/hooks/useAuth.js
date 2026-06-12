import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Thin hook used by Navbar logout and any component that needs
 * the current user state + logout action.
 *
 * For login/register, pages call authService directly so they
 * can control navigation themselves.
 */
export const useAuth = () => {
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const logout = async () => {
    try { await authService.logout(); } catch {}
    storeLogout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isAdmin    = () => user?.role === 'admin';
  const isVendor   = () => user?.role === 'vendor';
  const isCustomer = () => user?.role === 'customer';

  return { user, isAuthenticated, logout, isAdmin, isVendor, isCustomer };
};
