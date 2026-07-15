import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, ChevronRight, Loader } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { rewardService } from '../../services/rewardService';
import { useRewardStore } from '../../store/rewardStore';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const TYPE_ICON = { earn_order:'🛒', earn_review:'⭐', earn_referral:'👥', earn_daily:'☀️', earn_follow:'💚', earn_post_like:'❤️', spend_discount:'🎁', spend_coupon:'🎟️', admin_adjust:'⚙️' };

export default function RewardsPage() {
  const [wallet,   setWallet]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [tab,      setTab]      = useState('overview');
  const { setBalance } = useRewardStore();
  const navigate = useNavigate();

  useEffect(() => { fetchWallet(); }, []);
  const fetchWallet = () => {
    rewardService.getWallet().then(({ data }) => { setWallet(data.data); setBalance(Number(data.data.balance)); }).catch(() => {}).finally(() => setLoading(false));
  };

  const handleClaimDaily = async () => {
    setClaiming(true);
    try {
      const { data } = await rewardService.claimDaily();
      toast.success(data.message); setBalance(Number(data.data.balanceAfter)); fetchWallet();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setClaiming(false); }
  };

  const canClaim = () => {
    if (!wallet?.lastDailyRewardAt) return true;
    return new Date(wallet.lastDailyRewardAt).toDateString() !== new Date().toDateString();
  };

  if (loading) return <MainLayout><div className="page-container py-20 text-center"><Loader size={28} className="animate-spin text-primary mx-auto"/></div></MainLayout>;

  return (
    <MainLayout>
      <div className="page-container py-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-soft">
            <span className="text-4xl">🪙</span>
          </div>
          <h1 className="font-poppins font-bold text-3xl text-brand-dark">Kitchen Coins</h1>
          <p className="text-brand-muted mt-1">Earn coins, get discounts!</p>
        </div>

        {/* Balance */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white mb-5">
          <p className="text-white/70 text-sm mb-1">Your Balance</p>
          <p className="font-poppins font-bold text-5xl mb-1">{Number(wallet?.balance||0).toFixed(0)} <span className="text-2xl text-white/80">coins</span></p>
          <p className="text-white/70 text-sm">≈ ₦{(Math.floor(Number(wallet?.balance||0)/10)*100).toLocaleString()} discount value</p>
          <div className="flex gap-4 mt-3 text-sm">
            <div><p className="text-white/60 text-xs">Earned</p><p className="font-semibold">{Number(wallet?.totalEarned||0).toFixed(0)}</p></div>
            <div className="w-px bg-white/20"/><div><p className="text-white/60 text-xs">Spent</p><p className="font-semibold">{Number(wallet?.totalSpent||0).toFixed(0)}</p></div>
            {(wallet?.streakDays||0) > 0 && <><div className="w-px bg-white/20"/><div><p className="text-white/60 text-xs">Streak</p><p className="font-semibold">🔥{wallet.streakDays}d</p></div></>}
          </div>
        </div>

        {/* Daily claim */}
        <motion.button whileTap={{scale:0.97}} onClick={handleClaimDaily} disabled={!canClaim()||claiming}
          className={`w-full rounded-2xl p-4 flex items-center justify-between mb-5 transition-all ${canClaim()?'bg-yellow-50 border-2 border-yellow-200 hover:border-yellow-400':'bg-gray-50 border-2 border-gray-100 opacity-60 cursor-not-allowed'}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">☀️</div>
            <div className="text-left">
              <p className="font-semibold text-brand-dark text-sm">{canClaim()?'Claim Daily Reward':'Already claimed today!'}</p>
              <p className="text-xs text-brand-muted">{canClaim()?`+3 coins · ${(wallet?.streakDays||0)+1}-day streak`:'Come back tomorrow'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-400 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
            {claiming ? '…' : <><span>+3</span><span>🪙</span></>}
          </div>
        </motion.button>

        {/* How to earn */}
        <div className="card p-5 mb-5">
          <h2 className="font-poppins font-semibold text-brand-dark mb-4">How to Earn</h2>
          <div className="space-y-3">
            {[['🛒','Place an order','1 coin / ₦100'],['⭐','Write a review','10 coins'],['💚','Follow a vendor','5 coins'],['☀️','Daily login','3 coins'],['👥','Refer a friend','50 coins']].map(([icon,text,coins])=>(
              <div key={text} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5"><span className="text-xl w-7">{icon}</span><span className="text-sm text-brand-dark">{text}</span></div>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{coins}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        {wallet?.recentTransactions?.length > 0 && (
          <div className="card p-5">
            <h2 className="font-poppins font-semibold text-brand-dark mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {wallet.recentTransactions.slice(0,8).map((tx)=>(
                <div key={tx.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-7">{TYPE_ICON[tx.type]||'🪙'}</span>
                    <div><p className="text-sm font-medium text-brand-dark leading-tight">{tx.description}</p><p className="text-xs text-brand-muted">{formatDateTime(tx.createdAt)}</p></div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${Number(tx.amount)>0?'text-accent':'text-primary'}`}>{Number(tx.amount)>0?'+':''}{Number(tx.amount).toFixed(0)} 🪙</p>
                    <p className="text-xs text-brand-muted">{Number(tx.balanceAfter).toFixed(0)} bal.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
