import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { rewardService } from '../../services/rewardService';
import { useRewardStore } from '../../store/rewardStore';
import toast from 'react-hot-toast';

export default function DailyRewardModal({ isOpen, onClose }) {
  const [claiming, setClaiming] = useState(false);
  const [result,   setResult]   = useState(null);
  const { incrementBalance } = useRewardStore();

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data } = await rewardService.claimDaily();
      setResult(data.data);
      incrementBalance(data.data.coins);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not claim');
      onClose();
    } finally { setClaiming(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

          <motion.div
            initial={{ opacity:0, scale:0.8, y:30 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.8 }}
            transition={{ type:'spring', damping:22, stiffness:320 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-card-hover w-full max-w-xs overflow-hidden text-center">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-8 relative">
                <button onClick={onClose}
                  className="absolute top-3 right-3 w-7 h-7 bg-white/20 text-white rounded-full flex items-center justify-center">
                  <X size={14} />
                </button>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-6xl mb-2"
                >🪙</motion.div>
                <p className="text-white font-poppins font-bold text-xl">Daily Reward!</p>
                <p className="text-white/80 text-sm mt-1">You're on a streak 🔥</p>
              </div>

              <div className="p-6">
                {result ? (
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                    <p className="font-poppins font-bold text-4xl text-primary mb-1">
                      +{result.coins} <span className="text-2xl">🪙</span>
                    </p>
                    <p className="text-sm text-brand-muted mb-1">Kitchen Coins earned!</p>
                    {result.streak > 1 && (
                      <p className="text-xs text-orange-500 font-semibold">
                        🔥 {result.streak}-day streak! Keep it up!
                      </p>
                    )}
                    <p className="text-xs text-brand-muted mt-3">Balance: {result.balanceAfter} coins</p>
                    <button onClick={onClose} className="btn-primary w-full mt-4 py-3">
                      Awesome! 🎉
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-brand-dark font-semibold mb-1">Claim your daily reward</p>
                    <p className="text-sm text-brand-muted mb-5">
                      Earn Kitchen Coins every day you visit.<br />
                      Longer streaks = bigger bonuses!
                    </p>
                    <button onClick={handleClaim} disabled={claiming}
                      className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                      {claiming
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Claiming…</>
                        : '✨ Claim Free Coins'
                      }
                    </button>
                    <button onClick={onClose} className="text-xs text-brand-muted mt-3 hover:underline block w-full">
                      Maybe later
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
