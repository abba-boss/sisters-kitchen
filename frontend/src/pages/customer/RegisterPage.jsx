import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ChefHat, User, Mail, Lock, Phone, Store } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'customer';

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    role: defaultRole, businessName: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

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
      await register(form);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-brand-muted mt-1 text-sm">Create your account for free</p>
        </div>

        <div className="card p-8">
          {/* Role Toggle */}
          <div className="flex gap-1 bg-brand-bg rounded-2xl p-1 mb-6">
            {['customer', 'vendor'].map((r) => (
              <button key={r} type="button" onClick={() => setForm((p) => ({ ...p, role: r }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all flex items-center justify-center gap-1.5 ${
                  form.role === r ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
                }`}>
                {r === 'vendor' ? <Store size={15} /> : <User size={15} />} {r === 'vendor' ? 'Vendor' : 'Customer'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">First Name *</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Jane" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Last Name *</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" className="input-field text-sm" />
              </div>
            </div>

            {form.role === 'vendor' && (
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Business Name *</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="text" name="businessName" value={form.businessName} onChange={handleChange} placeholder="Mama Ngozi's Kitchen" className="input-field pl-10 text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" className="input-field pl-10 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+234 ..." className="input-field pl-10 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className="input-field pl-10 pr-10 text-sm" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
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
