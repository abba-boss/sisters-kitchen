import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCcw, ShieldCheck } from 'lucide-react';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.join('').length !== OTP_LENGTH) {
      toast.error('Enter the full verification code');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('OTP verified preview complete');
      navigate('/login');
    }, 650);
  };

  return (
    <AuthSplitLayout
      variant="otp"
      title="Enter verification code"
      subtitle={email ? `We prepared this verification preview for ${email}.` : 'Enter the code sent to your email or phone.'}
      footer={(
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-brand-bg/50 p-4 text-sm">
            <span className="text-brand-muted">Didn&apos;t get a code?</span>
            <button
              type="button"
              onClick={() => toast.success('Code resent preview')}
              className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
            >
              <RefreshCcw size={14} />
              Resend code
            </button>
          </div>
          <p className="text-center text-sm text-brand-muted">
            Wrong email?{' '}
            <Link to="/forgot-password" className="font-semibold text-primary hover:underline">Go back</Link>
          </p>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-brand-muted">
            <ShieldCheck size={15} className="text-primary" />
            Secure code verification
          </div>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => { inputsRef.current[index] = el; }}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                whileFocus={{ scale: 1.04 }}
                inputMode="numeric"
                maxLength={1}
                className="h-14 w-12 sm:h-16 sm:w-14 rounded-2xl border border-orange-100 bg-white text-center font-poppins text-xl font-bold text-brand-dark shadow-soft outline-none transition focus:border-primary"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-brand-bg/50 p-4 text-sm text-brand-muted">
          This OTP screen is a premium UI placeholder. No authentication API was changed or added.
        </div>

        <motion.button type="submit" whileTap={{ scale: 0.99 }} disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying…
            </span>
          ) : (
            <>
              Verify Code
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>
    </AuthSplitLayout>
  );
}
