import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins, Star, TrendingUp, Award, Calendar, ChevronRight, Loader } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { rewardService } from '../../services/rewardService';
import { useRewardStore } from '../../store/rewardStore';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function RewardsPage() {
  const { isAuthenticated } = useAuthStore();
  const { balance, setBalance, setShowDailyModal } = useRewardStore();
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    Promise.all([
      rewardService.getWallet(),
      rewardService.getHistory({ limit: 20 }),
    ])
      .then(([wRes, hRes]) => {
        setWallet(wRes.data.data);
        setBalance(wRes.data.data?.balance || 0);
        setHistory(hRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleClaimDaily = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const { data } = await rewardService.claimDaily();
      toast.success(`🎉 You earned ${data.data?.points || 10} Kitchen Coins!`);
      setBalance(balance + (data.data?.points || 10));
      setWallet((w) => ({ ...w, balance: (w?.balance || 0) + (data.data?.points || 10) }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already claimed today');
    } finally {
      setClaiming(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Gift size={28} className="text-primary" />
          </div>
          <h2 className="font-poppins font-bold text-2xl text-brand-dark mb-2">Kitchen Rewards</h2>
          <p className="text-brand-muted mb-6">Sign in to earn and redeem Kitchen Coins.</p>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container py-10">
        <div className="mb-8">
          <h1 className="font-poppins font-bold text-3xl text-brand-dark mb-1">Kitchen Rewards</h1>
          <p className="text-brand-muted">Earn Kitchen Coins for every order, review, and social action.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
            {/* Left — wallet card */}
            <div className="space-y-4">
              {/* Balance card */}
              <div className="rounded-[2rem] bg-gradient-to-br from-primary to-orange-400 text-white p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Coins size={24} />
                  </div>
                  <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                    Kitchen Coins
                  </span>
                </div>
                <p className="text-white/80 text-sm mb-1">Your balance</p>
                <p className="font-poppins font-bold text-5xl mb-1">
                  {wallet?.balance || 0}
                </p>
                <p className="text-white/70 text-sm">≈ ₦{((wallet?.balance || 0) * 5).toLocaleString()} value</p>
              </div>

              {/* Daily claim */}
              <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-2xl flex items-center justify-center">
                    <Calendar size={18} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-dark text-sm">Daily Check-in</p>
                    <p className="text-xs text-brand-muted">Claim 10 coins every day</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleClaimDaily}
                  disabled={claiming}
                  className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  {claiming ? <Loader size={15} className="animate-spin" /> : <Gift size={15} />}
                  Claim Daily Reward
                </motion.button>
              </div>

              {/* How to earn */}
              <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5">
                <p className="font-semibold text-brand-dark mb-3">How to Earn</p>
                <div className="space-y-3">
                  {[
                    { icon: Award,    label: 'Place an order',      coins: '+50' },
                    { icon: Star,     label: 'Leave a review',      coins: '+20' },
                    { icon: Gift,     label: 'Daily check-in',      coins: '+10' },
                    { icon: TrendingUp, label: 'Refer a friend',    coins: '+100' },
                  ].map(({ icon: Icon, label, coins }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon size={15} className="text-primary" />
                      </div>
                      <p className="flex-1 text-sm text-brand-dark">{label}</p>
                      <span className="text-sm font-bold text-accent">{coins}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — history */}
            <div>
              <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card p-6">
                <h2 className="font-poppins font-bold text-xl text-brand-dark mb-4">Transaction History</h2>
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins size={32} className="text-brand-muted mx-auto mb-3" />
                    <p className="text-brand-muted">No transactions yet. Start earning!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((tx) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg/50 border border-orange-50"
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          tx.type === 'credit' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                        }`}>
                          {tx.type === 'credit' ? <TrendingUp size={16} /> : <Coins size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-dark truncate">{tx.description}</p>
                          <p className="text-xs text-brand-muted">{formatDate(tx.createdAt)}</p>
                        </div>
                        <span className={`font-poppins font-bold text-base ${
                          tx.type === 'credit' ? 'text-accent' : 'text-primary'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}{tx.points}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
