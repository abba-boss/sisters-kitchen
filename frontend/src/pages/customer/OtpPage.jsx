import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCcw, ShieldCheck } from 'lucide-react';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('Start from the forgot password page');
      navigate('/forgot-password', { replace: true });
      return;
    }
    inputsRef.current[0]?.focus();
  }, [email, navigate]);

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

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error('Enter the full verification code');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp({ email, otp: code });
      toast.success('Code verified');
      navigate('/reset-password', { state: { email, otp: code, verified: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const { data } = await authService.resendOtp({ email });
      if (data.debugOtp) toast.success(`Dev code: ${data.debugOtp}`, { duration: 8000 });
      else toast.success(data.message || 'A new code was sent');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthSplitLayout
      variant="otp"
      title="Enter verification code"
      subtitle={email ? `We sent a 6-digit code for ${email}.` : 'Enter the code sent to your email.'}
      footer={(
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-brand-bg/50 p-4 text-sm">
            <span className="text-brand-muted">Didn&apos;t get a code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-2 font-semibold text-primary hover:underline disabled:opacity-60"
            >
              <RefreshCcw size={14} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Sending…' : 'Resend code'}
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
            Secure code verification · expires in 10 minutes
          </div>
          <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
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
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                className="h-14 w-12 sm:h-16 sm:w-14 rounded-2xl border border-orange-100 bg-white text-center font-poppins text-xl font-bold text-brand-dark shadow-soft outline-none transition focus:border-primary"
              />
            ))}
          </div>
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
