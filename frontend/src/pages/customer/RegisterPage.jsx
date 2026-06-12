import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChefHat, User, Mail, Lock, Phone, Store, Clock, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultRole = searchParams.get('role') || 'customer';

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    role: defaultRole, businessName: '',
  });
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  // Show the "under review" success screen for vendors
  const [vendorRegistered, setVendorRegistered] = useState(false);
  const [vendorName, setVendorName]             = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('Please fill all required fields'); return;
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.role === 'vendor' && !form.businessName) { toast.error('Business name is required'); return; }

    setLoading(true);
    try {
      const { data } = await authService.register(form);
      const { user, accessToken, refreshToken } = data.data;

      if (form.role === 'vendor') {
        // Store auth but show "under review" screen instead of navigating to dashboard
        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
        setVendorName(form.businessName || `${form.firstName}'s Kitchen`);
        setVendorRegistered(true);
      } else {
        // Customer — log in and go home
        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
        toast.success('Welcome to Sisters Kitchen! 🎉');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Vendor "under review" success screen ──────────────────────
  if (vendorRegistered) {
    return (
      <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="card p-10 max-w-md w-full text-center"
        >
          {/* Animated clock icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.1 }}
            className="w-20 h-20 bg-yellow-50 rounded-3xl flex items-center justify-center mx-auto mb-5"
          >
            <Clock size={38} className="text-yellow-500" />
          </motion.div>

          <h1 className="font-poppins font-bold text-2xl text-brand-dark mb-2">
            Account Under Review 🎉
          </h1>
          <p className="text-brand-muted text-sm leading-relaxed mb-6">
            Thank you for registering <strong className="text-brand-dark">{vendorName}</strong> on Sisters Kitchen!
            <br /><br />
            Your vendor account has been created and is <strong className="text-brand-dark">currently under review</strong> by our team.
            We typically approve accounts within <strong className="text-brand-dark">24–48 hours</strong>.
          </p>

          {/* Steps */}
          <div className="text-left space-y-3 mb-7 bg-brand-bg rounded-2xl p-4">
            {[
              { icon: CheckCircle, color: 'text-accent', text: 'Account created successfully' },
              { icon: Clock,       color: 'text-yellow-500', text: 'Under review by our team', active: true },
              { icon: CheckCircle, color: 'text-brand-muted', text: 'Approval notification via email' },
              { icon: Store,       color: 'text-brand-muted', text: 'Start adding products & selling' },
            ].map(({ icon: Icon, color, text, active }, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm ${active ? 'font-semibold text-brand-dark' : 'text-brand-muted'}`}>
                <Icon size={16} className={`${color} flex-shrink-0`} />
                {text}
                {active && (
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-medium">
                    Now
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/vendor/dashboard')}
              className="btn-primary w-full"
            >
              Go to My Dashboard
            </button>
            <Link to="/" className="block text-sm text-brand-muted hover:text-primary transition-colors">
              Browse the marketplace meanwhile →
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Normal registration form ──────────────────────────────────
  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4 py-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
              <ChefHat size={22} className="text-white" />
            </div>
            <span className="font-poppins font-bold text-2xl text-brand-dark">
              Sisters <span className="text-primary">Kitchen</span>
            </span>
          </Link>
          <h1 className="font-poppins font-bold text-2xl text-brand-dark">Join the Community 🎉</h1>
          <p className="text-brand-muted mt-1 text-sm">Create your free account</p>
        </div>

        <div className="card p-8">
          {/* Role Toggle */}
          <div className="flex gap-1 bg-brand-bg rounded-2xl p-1 mb-6">
            {['customer', 'vendor'].map((r) => (
              <button key={r} type="button" onClick={() => setForm((p) => ({ ...p, role: r }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  form.role === r ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
                }`}>
                {r === 'vendor' ? <Store size={15} /> : <User size={15} />}
                {r === 'vendor' ? 'Vendor' : 'Customer'}
              </button>
            ))}
          </div>

          {/* Vendor notice */}
          <AnimatePresence>
            {form.role === 'vendor' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-5"
              >
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3.5">
                  <Clock size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Vendor accounts need approval</p>
                    <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">
                      After registering, your account will be reviewed by our team within 24–48 hrs
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">First Name *</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                  placeholder="Jane" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Last Name *</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                  placeholder="Doe" className="input-field text-sm" />
              </div>
            </div>

            {form.role === 'vendor' && (
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Business Name *</label>
                <div className="relative">
                  <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="text" name="businessName" value={form.businessName} onChange={handleChange}
                    placeholder="Mama Ngozi's Kitchen" className="input-field pl-10 text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Email *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@email.com" className="input-field pl-10 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+234 ..." className="input-field pl-10 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type={showPwd ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="Min. 6 characters"
                  className="input-field pl-10 pr-10 text-sm" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                form.role === 'vendor' ? 'Register as Vendor' : 'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
