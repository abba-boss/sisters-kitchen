import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect back to where the user came from, or role-based default
  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      const { user, accessToken, refreshToken } = data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}! 🍽️`);

      // Navigate: back to original page → or role dashboard → or home
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      variant="login"
      title="Welcome back"
      subtitle={from
        ? "Sign in to continue. You'll be taken right back to where you were."
        : 'Sign in to continue your premium food journey.'}
      footer={(
        <div className="space-y-4">
          <details className="group rounded-2xl border border-orange-100 bg-brand-bg/50 px-4 py-3">
            <summary className="cursor-pointer select-none text-sm font-medium text-brand-dark hover:text-primary transition-colors">
              Demo credentials
            </summary>
            <div className="mt-3 space-y-2 text-xs">
              {[
                ['Customer', 'customer@sisterskitchen.ng', 'Customer@2024'],
                ['Vendor', 'mama.ngozi@sisterskitchen.ng', 'Vendor@2024'],
                ['Admin', 'admin@sisterskitchen.ng', 'Admin@2024'],
              ].map(([role, email, pwd]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ email, password: pwd })}
                  className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left transition hover:border-primary/20 hover:bg-orange-50"
                >
                  <span className="font-semibold text-brand-dark">{role}</span>
                  <span className="ml-2 truncate text-brand-muted">{email}</span>
                </button>
              ))}
            </div>
          </details>
          <div className="text-center text-sm text-brand-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">Create one free</Link>
          </div>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-dark">Email Address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="your@email.com" autoComplete="email"
              className="input-field pl-11 transition focus:scale-[1.01]" />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-brand-dark">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input type={showPwd ? 'text' : 'password'} name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" autoComplete="current-password"
              className="input-field pl-11 pr-11 transition focus:scale-[1.01]" />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary transition-colors">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.99 }} className="btn-primary w-full py-3.5 text-base">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : 'Sign In'}
        </motion.button>
      </form>
    </AuthSplitLayout>
  );
}
