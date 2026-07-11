import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gift, Flame, Star, ShoppingBag, MessageSquare, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { rewardService } from '../../services/rewardService';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const TYPE_META = {
  earn_order:     { icon: '🛒', label: 'Order Reward',    color: 'text-accent'   },
  earn_review:    { icon: '⭐', label: 'Review Reward',   color: 'text-yellow-500'},
  earn_referral:  { icon: '👥', label: 'Referral Bonus',  color: 'text-blue-500' },
  earn_daily:     { icon: '☀️', label: 'Daily Login',     color: 'text-orange-500'},
  earn_follow:    { icon: '💚', label: 'Follow Bonus',    color: 'text-accent'   },
  earn_post_like: { icon: '❤️', label: 'Like Bonus',      color: 'text-red-500'  },
  spend_discount: { icon: '🎁', label: 'Redeemed Coins',  color: 'text-primary'  },
  spend_coupon:   { icon: '🎟️', label: 'Coupon Used',    color: 'text-primary'  },
  admin_adjust:   { icon: '⚙️', label: 'Admin Adjustment', color: 'text-gray-500'},
};

const HOW_TO_EARN = [
  { icon: '🛒', text: 'Place an order',       coins: '1 coin / ₦100 spent' },
  { icon: '⭐', text: 'Write a review',        coins: '10 coins' },
  { icon: '👥', text: 'Refer a friend',        coins: '50 coins' },
  { icon: '☀️', text: 'Daily login',           coins: '3 coins/day' },
  { icon: '💚', text: 'Follow a vendor',       coins: '5 coins' },
  { icon: '🔥', text: '7-day streak bonus',    coins: '+1 extra coin/day' },
];

export default function RewardsPage() {
  const [wallet,  setWallet]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [tab, setTab] = useState('overview'); // overview | history

  useEffect(() => { fetchWallet(); }, []);

  const fetchWallet = () => {
    rewardService.getWallet()
      .then(({ data }) => setWallet(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleClaimDaily = async () => {
    setClaiming(true);
    try {
      const { data } = await rewardService.claimDaily();
      toast.success(data.message);
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not claim reward');
    } finally { setClaiming(false); }
  };

  const canClaimToday = () => {
    if (!wallet?.lastDailyRewardAt) return true;
    const last = new Date(wallet.lastDailyRewardAt);
    return last.toDateString() !== new Date().toDateString();
  };

  const coinToNaira = (coins) => Math.floor(coins / 10) * 100;

  if (loading) return (
    <MainLayout>
      <div className="page-container page-shell max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="page-container page-shell max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-soft">
            <span className="text-3xl">🪙</span>
          </div>
          <h1 className="font-poppins font-bold text-3xl text-brand-dark">Kitchen Coins</h1>
          <p className="text-brand-muted mt-1">Earn coins every time you order, review, and engage!</p>
        </div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white mb-5 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">Your Balance</p>
            <p className="font-poppins font-bold text-5xl mb-1">
              {Number(wallet?.balance || 0).toFixed(0)}
              <span className="text-2xl ml-2 text-white/80">coins</span>
            </p>
            <p className="text-white/70 text-sm">
              ≈ ₦{coinToNaira(wallet?.balance || 0).toLocaleString()} discount value
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div>
                <p className="text-white/60 text-xs">Total Earned</p>
                <p className="font-semibold">{Number(wallet?.totalEarned||0).toFixed(0)} coins</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-white/60 text-xs">Total Spent</p>
                <p className="font-semibold">{Number(wallet?.totalSpent||0).toFixed(0)} coins</p>
              </div>
              {(wallet?.streakDays||0) > 0 && (
                <>
                  <div className="w-px h-8 bg-white/20" />
                  <div>
                    <p className="text-white/60 text-xs">Streak</p>
                    <p className="font-semibold">🔥 {wallet.streakDays} days</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Daily reward CTA */}
        <motion.button
          onClick={handleClaimDaily}
          disabled={!canClaimToday() || claiming}
          whileTap={{ scale: 0.97 }}
          className={`w-full rounded-2xl p-4 flex items-center justify-between mb-5 transition-all ${
            canClaimToday()
              ? 'bg-yellow-50 border-2 border-yellow-200 hover:border-yellow-400'
              : 'bg-gray-50 border-2 border-gray-100 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">☀️</div>
            <div className="text-left">
              <p className="font-semibold text-brand-dark text-sm">
                {canClaimToday() ? 'Claim Daily Reward' : 'Already claimed today!'}
              </p>
              <p className="text-xs text-brand-muted">
                {canClaimToday()
                  ? `Earn 3+ coins · ${(wallet?.streakDays||0)+1}-day streak`
                  : 'Come back tomorrow for more coins'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-400 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
            {claiming ? '...' : <><span>+3</span><span>🪙</span></>}
          </div>
        </motion.button>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card mb-5 w-fit">
          {[['overview','Overview'],['history','History']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* How to earn */}
            <div className="card p-5">
              <h2 className="font-poppins font-semibold text-brand-dark mb-4">How to Earn Coins 🪙</h2>
              <div className="space-y-3">
                {HOW_TO_EARN.map(({ icon, text, coins }) => (
                  <div key={text} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-7 text-center">{icon}</span>
                      <span className="text-sm text-brand-dark">{text}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {coins}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Redeem info */}
            <div className="card p-5 bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
              <h2 className="font-poppins font-semibold text-brand-dark mb-3 flex items-center gap-2">
                <Gift size={18} className="text-accent" /> Redeem Your Coins
              </h2>
              <p className="text-sm text-brand-muted mb-3 leading-relaxed">
                Use your Kitchen Coins for discounts at checkout.
                <strong className="text-brand-dark"> 10 coins = ₦100 discount.</strong>
              </p>
              <div className="bg-white rounded-xl p-3 text-sm text-brand-muted">
                You have <strong className="text-accent">{Number(wallet?.balance||0).toFixed(0)} coins</strong> ·
                worth <strong className="text-accent">₦{coinToNaira(wallet?.balance||0).toLocaleString()}</strong> in discounts
              </div>
            </div>

            {/* Recent transactions */}
            {wallet?.recentTransactions?.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-poppins font-semibold text-brand-dark">Recent Activity</h2>
                  <button onClick={() => setTab('history')} className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5">
                    View all <ChevronRight size={13} />
                  </button>
                </div>
                <TransactionList transactions={wallet.recentTransactions.slice(0, 5)} />
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <FullHistory />
        )}
      </div>
    </MainLayout>
  );
}

function TransactionList({ transactions }) {
  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const meta = TYPE_META[tx.type] || { icon: '🪙', label: tx.type, color: 'text-brand-dark' };
        const isEarn = Number(tx.amount) > 0;
        return (
          <div key={tx.id} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-bg rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                {meta.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-brand-dark leading-tight">{tx.description}</p>
                <p className="text-xs text-brand-muted mt-0.5">{formatDateTime(tx.createdAt)}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className={`text-sm font-bold ${isEarn ? 'text-accent' : 'text-primary'}`}>
                {isEarn ? '+' : ''}{Number(tx.amount).toFixed(0)} 🪙
              </p>
              <p className="text-xs text-brand-muted">{Number(tx.balanceAfter).toFixed(0)} bal.</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FullHistory() {
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = (p = 1) => {
    setLoading(true);
    rewardService.getHistory({ page: p, limit: 20 })
      .then(({ data }) => {
        const items = data.data || [];
        setTxs((prev) => p === 1 ? items : [...prev, ...items]);
        setHasMore(items.length === 20);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="card p-5">
      <h2 className="font-poppins font-semibold text-brand-dark mb-4">Full Transaction History</h2>
      {loading && page === 1 ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="skeleton h-14 rounded-xl"/>)}</div>
      ) : txs.length === 0 ? (
        <p className="text-center text-brand-muted text-sm py-8">No transactions yet. Start earning! 🪙</p>
      ) : (
        <>
          <TransactionList transactions={txs} />
          {hasMore && (
            <button onClick={() => load(page+1)} disabled={loading}
              className="w-full mt-4 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
