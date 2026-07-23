import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';
  const verified = location.state?.verified === true;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !verified) {
      toast.error('Verify your code first');
      navigate('/forgot-password', { replace: true });
    }
  }, [email, verified, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.resetPassword({
        email,
        otp,
        newPassword: password,
      });
      toast.success(data.message || 'Password updated');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      variant="forgot"
      title="Create a new password"
      subtitle={`Choose a new password for ${email || 'your account'}.`}
      footer={(
        <p className="text-center text-sm text-brand-muted">
          Back to{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 text-sm text-brand-muted flex items-start gap-2">
          <ShieldCheck size={16} className="text-accent mt-0.5 flex-shrink-0" />
          Your code was verified. Set a strong password to finish.
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-dark">New password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-11 pr-12"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-primary"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-dark">Confirm password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field pl-11"
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <motion.button type="submit" whileTap={{ scale: 0.99 }} disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : (
            <>
              Update password
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>
    </AuthSplitLayout>
  );
}
