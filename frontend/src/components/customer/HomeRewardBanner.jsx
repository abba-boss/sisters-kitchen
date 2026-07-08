import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gift } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useRewardStore } from '../../store/rewardStore';

export default function HomeRewardBanner() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { balance } = useRewardStore();

  return (
    <section className="py-8 bg-white">
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-orange-500 to-yellow-400 p-6 sm:p-8"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left */}
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <span className="text-3xl">🪙</span>
                <h3 className="font-poppins font-bold text-xl sm:text-2xl text-white">
                  Share &amp; Earn Rewards
                </h3>
              </div>
              <p className="text-white/80 text-sm max-w-sm">
                Invite your friends and earn Kitchen Coins. Use coins for
                discounts on every order!
              </p>
              {isAuthenticated && balance > 0 && (
                <p className="text-white/70 text-xs mt-2 font-medium">
                  💰 You currently have <strong className="text-white">{Math.floor(balance)} coins</strong>
                </p>
              )}
            </div>

            {/* Right */}
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(isAuthenticated ? '/rewards' : '/register')}
                className="flex items-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-2xl hover:bg-orange-50 transition-all shadow-soft text-sm"
              >
                <Gift size={16} />
                {isAuthenticated ? 'View Rewards' : 'Invite Now'}
                <ArrowRight size={15} />
              </motion.button>

              {!isAuthenticated && (
                <p className="text-white/70 text-xs text-center">
                  Get 50 coins for<br />every referral! 🎁
                </p>
              )}
            </div>
          </div>

          {/* Floating coin emojis */}
          {['🪙','🎁','⭐','🪙'].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-xl pointer-events-none select-none opacity-20"
              style={{
                top:  `${15 + i * 18}%`,
                right: `${8 + i * 6}%`,
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
