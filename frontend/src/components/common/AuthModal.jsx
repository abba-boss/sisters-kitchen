import { useState } from 'react';
import { ChefHat, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import Modal from './Modal';
import toast from 'react-hot-toast';

export default function AuthModal() {
  const { isOpen, message, close, complete } = useAuthModalStore();
  const [mode, setMode] = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });

  const handleClose = () => {
    if (!loading) close();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.login(loginForm);
      const { user, accessToken, refreshToken } = data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      complete(user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password } = regForm;
    if (!firstName || !lastName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.register({ ...regForm, role: 'customer' });
      const { user, accessToken, refreshToken } = data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      toast.success('Account created successfully!');
      complete(user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showClose={!loading}
      title={mode === 'login' ? 'Welcome back' : 'Create account'}
      description={message || 'Sign in to continue shopping'}
    >
      <div className="flex items-center justify-center -mt-2 mb-5">
        <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
          <ChefHat size={20} className="text-white" />
        </div>
      </div>

      <div className="flex gap-1 bg-brand-bg rounded-2xl p-1 mb-5">
        {[['login', 'Sign In'], ['register', 'Sign Up']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === key ? 'bg-white text-primary shadow-card' : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <div className="relative">
              <Mail size={15} className="input-icon" />
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@email.com"
                autoComplete="email"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={15} className="input-icon" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Your password"
                autoComplete="current-password"
                className="input-field pl-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary p-1"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">First name *</label>
              <input
                type="text"
                value={regForm.firstName}
                onChange={(e) => setRegForm((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Jane"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="form-label">Last name *</label>
              <input
                type="text"
                value={regForm.lastName}
                onChange={(e) => setRegForm((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Doe"
                className="input-field text-sm"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Email *</label>
            <div className="relative">
              <Mail size={14} className="input-icon" />
              <input
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@email.com"
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Phone</label>
            <div className="relative">
              <Phone size={14} className="input-icon" />
              <input
                type="tel"
                value={regForm.phone}
                onChange={(e) => setRegForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+234 …"
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Password *</label>
            <div className="relative">
              <Lock size={14} className="input-icon" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={regForm.password}
                onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="At least 6 characters"
                className="input-field pl-9 pr-9 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary p-1"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-brand-muted mt-4 leading-relaxed">
        Your cart and preferences are saved when you sign in.
      </p>
    </Modal>
  );
}
