import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ChefHat, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const location = useLocation();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <p className="text-brand-muted mt-1 text-sm">Sign in to continue your food journey</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-brand-dark mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="input-field pl-11"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-brand-dark mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary transition-colors">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create one free</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
