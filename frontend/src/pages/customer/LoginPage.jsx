import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ChefHat, Mail, Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
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
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
              <ChefHat size={22} className="text-white" />
            </div>
            <span className="font-poppins font-bold text-2xl text-brand-dark">
              Sisters <span className="text-primary">Kitchen</span>
            </span>
          </Link>
          <h1 className="font-poppins font-bold text-2xl text-brand-dark">Welcome back! 👋</h1>
          {from ? (
            <p className="text-brand-muted mt-1 text-sm">
              Sign in to continue — you'll be taken back to where you were
            </p>
          ) : (
            <p className="text-brand-muted mt-1 text-sm">Sign in to continue your food journey</p>
          )}
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-brand-dark mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="your@email.com" autoComplete="email"
                  className="input-field pl-11" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-brand-dark mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type={showPwd ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="••••••••" autoComplete="current-password"
                  className="input-field pl-11 pr-11" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary transition-colors">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <details className="mt-4 group">
            <summary className="text-xs text-brand-muted cursor-pointer hover:text-primary transition-colors text-center select-none">
              Demo credentials ↓
            </summary>
            <div className="mt-3 space-y-2 text-xs bg-brand-bg rounded-xl p-3">
              {[
                ['Customer', 'customer@sisterskitchen.ng',       'Customer@2024'],
                ['Vendor',   'mama.ngozi@sisterskitchen.ng',     'Vendor@2024'  ],
                ['Admin',    'admin@sisterskitchen.ng',          'Admin@2024'   ],
              ].map(([role, email, pwd]) => (
                <button key={role} type="button"
                  onClick={() => setForm({ email, password: pwd })}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors text-left"
                >
                  <span className="font-semibold text-brand-dark">{role}</span>
                  <span className="text-brand-muted truncate ml-2">{email}</span>
                </button>
              ))}
            </div>
          </details>

          <div className="mt-5 text-center text-sm text-brand-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create one free</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
