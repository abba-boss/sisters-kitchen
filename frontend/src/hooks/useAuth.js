import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, logout: storeLogout, isAdmin, isVendor, isCustomer } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    const { user, accessToken, refreshToken } = data.data;
    setAuth(user, accessToken, refreshToken);
    toast.success(`Welcome back, ${user.firstName}! 🍽️`);

    if (user.role === 'admin') navigate('/admin/dashboard');
    else if (user.role === 'vendor') navigate('/vendor/dashboard');
    else navigate('/');

    return user;
  };

  const register = async (formData) => {
    const { data } = await authService.register(formData);
    const { user, accessToken, refreshToken } = data.data;
    setAuth(user, accessToken, refreshToken);
    toast.success('Welcome to Sisters Kitchen! 🎉');

    if (user.role === 'vendor') navigate('/vendor/dashboard');
    else navigate('/');

    return user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    storeLogout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return { user, isAuthenticated, login, register, logout, isAdmin, isVendor, isCustomer };
};
