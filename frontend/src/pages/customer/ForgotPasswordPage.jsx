import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword({ email: email.trim() });
      if (data.debugOtp) {
        toast.success(`Dev code: ${data.debugOtp}`, { duration: 8000 });
      } else {
        toast.success(data.message || 'Check your email for a verification code');
      }
      navigate('/otp', { state: { email: email.trim().toLowerCase() } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      variant="forgot"
      title="Forgot your password?"
      subtitle="Enter the email linked to your account and we’ll send a 6-digit verification code."
      footer={(
        <div className="space-y-3">
          <div className="rounded-2xl border border-orange-100 bg-brand-bg/50 p-4 text-sm text-brand-muted">
            <p className="font-semibold text-brand-dark flex items-center gap-2 mb-1">
              <ShieldCheck size={15} className="text-primary" />
              Secure reset
            </p>
            Codes expire in 10 minutes. In local development the code is also shown in a toast and the backend log.
          </div>
          <p className="text-center text-sm text-brand-muted">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-dark">Email Address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field pl-11 transition focus:scale-[1.01]"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <motion.button type="submit" whileTap={{ scale: 0.99 }} disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending code…
            </span>
          ) : (
            <>
              Continue to OTP
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>
    </AuthSplitLayout>
  );
}
