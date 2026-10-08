import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Coins, Flame, Zap } from 'lucide-react';
import { useRewardStore } from '../../store/rewardStore';
import { useAuthStore } from '../../store/authStore';
import { rewardService } from '../../services/rewardService';
import toast from 'react-hot-toast';

const LAST_CLAIMED_KEY = 'sk-last-daily-claimed';

export default function DailyRewardModal() {
  const { isAuthenticated } = useAuthStore();
  const { balance, setBalance, showDailyModal, setShowDailyModal } = useRewardStore();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [points, setPoints] = useState(10);
  const [streak, setStreak] = useState(1);

  // Auto-show modal once per day after login
  useEffect(() => {
    if (!isAuthenticated) return;

    const lastClaimed = localStorage.getItem(LAST_CLAIMED_KEY);
    const today = new Date().toDateString();

    if (lastClaimed !== today) {
      // Show after a short delay
      const timer = setTimeout(() => setShowDailyModal(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const { data } = await rewardService.claimDaily();
      const earned = data.data?.points || 10;
      setPoints(earned);
      setStreak(data.data?.streak || 1);
      setBalance(balance + earned);
      setClaimed(true);
      localStorage.setItem(LAST_CLAIMED_KEY, new Date().toDateString());
      toast.success(`🎉 +${earned} Kitchen Coins earned!`);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('already claimed')) {
        localStorage.setItem(LAST_CLAIMED_KEY, new Date().toDateString());
        setShowDailyModal(false);
      } else {
        toast.error(msg || 'Could not claim reward');
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    setShowDailyModal(false);
  };

  if (!showDailyModal || !isAuthenticated) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-card-hover overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-brand-muted hover:text-primary transition-colors z-10">
            <X size={16} />
          </button>

          {/* Header gradient */}
          <div className="bg-gradient-to-br from-primary via-orange-400 to-yellow-400 px-6 pt-8 pb-10 text-center relative overflow-hidden">
            {/* Floating coins */}
            {['🪙', '✨', '🎁', '⭐', '🪙'].map((emoji, i) => (
              <motion.span key={i}
                className="absolute text-xl select-none pointer-events-none"
                style={{ top: `${10 + i * 15}%`, left: `${5 + i * 20}%` }}
                animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
              >
                {emoji}
              </motion.span>
            ))}

            {/* Coin icon */}
            <motion.div
              animate={claimed ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : { y: [0, -6, 0] }}
              transition={claimed ? { duration: 0.5 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border-2 border-white/30"
            >
              <Coins size={36} className="text-white" />
            </motion.div>

            <h2 className="font-poppins font-bold text-2xl text-white mb-1">
              {claimed ? `+${points} Coins!` : 'Daily Reward'}
            </h2>
            <p className="text-white/80 text-sm">
              {claimed
                ? `Amazing! You earned ${points} Kitchen Coins 🎉`
                : 'Check in every day to earn Kitchen Coins'}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 pt-6 pb-8">
            {/* Streak */}
            {streak > 1 && (
              <div className="flex items-center justify-center gap-2 mb-5">
                <Flame size={16} className="text-orange-500" />
                <span className="text-sm font-semibold text-brand-dark">
                  {streak}-day streak! Keep going for bonus coins
                </span>
              </div>
            )}

            {/* What you earn */}
            {!claimed && (
              <div className="space-y-3 mb-6">
                {[
                  { icon: Gift,  label: 'Daily check-in bonus',  pts: '+10 coins' },
                  { icon: Zap,   label: 'Streak bonus (day 7)',  pts: '+50 coins' },
                  { icon: Coins, label: 'Order reward',          pts: '+50 coins' },
                ].map(({ icon: Icon, label, pts }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 bg-brand-bg rounded-2xl">
                    <div className="flex items-center gap-2.5 text-sm text-brand-dark">
                      <Icon size={15} className="text-primary" />
                      {label}
                    </div>
                    <span className="text-sm font-bold text-accent">{pts}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            {claimed ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-bold text-lg px-6 py-3 rounded-2xl mb-4">
                  <Coins size={20} /> {balance} Total Coins
                </div>
                <button onClick={handleClose}
                  className="w-full btn-primary py-3.5">
                  Awesome! Keep Shopping 🍽️
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleClaim}
                disabled={claiming}
                className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
              >
                {claiming
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Claiming…</>
                  : <><Gift size={18} /> Claim {points} Free Coins!</>}
              </motion.button>
            )}

            <p className="text-center text-xs text-brand-muted mt-3">
              Come back tomorrow for more coins ✨
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
