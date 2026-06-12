import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

/**
 * Inline auth modal — shown when a guest tries to checkout.
 * Calls onSuccess(user) after successful login/register so the parent
 * can continue the flow without page navigation.
 */
export default function AuthModal({ isOpen, onClose, onSuccess, redirectMessage }) {
  const [mode,    setMode]    = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm,   setRegForm]   = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { toast.error('Please fill in both fields'); return; }
    setLoading(true);
    try {
      const { data } = await authService.login(loginForm);
      const { user, accessToken, refreshToken } = data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}! 🍽️`);
      onSuccess?.(user);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password } = regForm;
    if (!firstName || !lastName || !email || !password) { toast.error('Please fill all required fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await authService.register({ ...regForm, role: 'customer' });
      const { user, accessToken, refreshToken } = data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      toast.success('Welcome to Sisters Kitchen! 🎉');
      onSuccess?.(user);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={  { opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-card-hover w-full max-w-md overflow-hidden">

              {/* Header */}
              <div className="relative bg-hero-pattern px-6 pt-8 pb-5 text-center">
                <button onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/60 text-brand-muted transition-colors">
                  <X size={17} />
                </button>
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <ChefHat size={22} className="text-white" />
                </div>
                <h2 className="font-poppins font-bold text-xl text-brand-dark">
                  {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
                </h2>
                {redirectMessage && (
                  <p className="text-sm text-brand-muted mt-1">{redirectMessage}</p>
                )}
              </div>

              {/* Tabs */}
              <div className="flex mx-6 mt-5 gap-1 bg-brand-bg rounded-2xl p-1">
                {[['login', 'Sign In'], ['register', 'Sign Up']].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setMode(key)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      mode === key ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="px-6 py-5">
                {/* ── LOGIN ── */}
                {mode === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Email</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input type="email" value={loginForm.email}
                          onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="you@email.com" autoComplete="email"
                          className="input-field pl-10 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input type={showPwd ? 'text' : 'password'} value={loginForm.password}
                          onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                          placeholder="••••••••" autoComplete="current-password"
                          className="input-field pl-10 pr-10 text-sm" />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary">
                          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                        : 'Sign In & Continue to Checkout'
                      }
                    </button>
                  </form>
                )}

                {/* ── REGISTER ── */}
                {mode === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-brand-dark mb-1 block">First Name *</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                          <input type="text" value={regForm.firstName}
                            onChange={e => setRegForm(p => ({ ...p, firstName: e.target.value }))}
                            placeholder="Jane" className="input-field pl-9 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-brand-dark mb-1 block">Last Name *</label>
                        <input type="text" value={regForm.lastName}
                          onChange={e => setRegForm(p => ({ ...p, lastName: e.target.value }))}
                          placeholder="Doe" className="input-field text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1 block">Email *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input type="email" value={regForm.email}
                          onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="you@email.com" className="input-field pl-9 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1 block">Phone</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input type="tel" value={regForm.phone}
                          onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+234 …" className="input-field pl-9 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1 block">Password *</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input type={showPwd ? 'text' : 'password'} value={regForm.password}
                          onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                          placeholder="Min. 6 characters" className="input-field pl-9 pr-9 text-sm" />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary">
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-1">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
                        : 'Create Account & Checkout'
                      }
                    </button>
                  </form>
                )}

                <p className="text-center text-xs text-brand-muted mt-4">
                  🛒 Your cart is safe — nothing will be lost
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
