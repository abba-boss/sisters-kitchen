import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck, Loader } from 'lucide-react';
import { followerService } from '../../services/followerService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import toast from 'react-hot-toast';

export default function FollowButton({ vendorId, size = 'md', variant = 'fill', className = '' }) {
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);
  const [following,   setFollowing]   = useState(false);
  const [count,       setCount]       = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [ready,       setReady]       = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !vendorId) { setReady(true); return; }
    followerService.getStatus(vendorId)
      .then(({ data }) => { setFollowing(data.data.following); setCount(data.data.followersCount); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [vendorId, isAuthenticated]);

  const handle = async () => {
    if (!isAuthenticated) { openAuth('Sign in to follow this vendor'); return; }
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await followerService.toggle(vendorId);
      setFollowing(data.following);
      setCount((c) => data.following ? c + 1 : Math.max(c - 1, 0));
      toast.success(data.message, { id: `follow-${vendorId}` });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const sizeClasses = { sm: 'text-xs px-3 py-1.5 gap-1', md: 'text-sm px-4 py-2 gap-1.5' };
  const base = `inline-flex items-center font-semibold rounded-full transition-all ${sizeClasses[size]} ${className}`;
  const style = following
    ? 'bg-brand-bg text-brand-muted border border-orange-100 hover:border-red-300 hover:text-red-500'
    : variant === 'fill'
      ? 'bg-primary text-white hover:bg-primary-dark shadow-soft'
      : 'border-2 border-primary text-primary hover:bg-primary hover:text-white';

  if (!ready && isAuthenticated) {
    return <div className={`${base} ${style} opacity-50`}><Loader size={size==='sm'?11:14} className="animate-spin"/></div>;
  }

  return (
    <motion.button whileTap={{ scale: 0.94 }} onClick={handle} disabled={loading} className={`${base} ${style}`}>
      {loading ? <Loader size={size==='sm'?11:14} className="animate-spin"/>
        : following ? <><UserCheck size={size==='sm'?12:15}/>Following</>
        : <><UserPlus size={size==='sm'?12:15}/>Follow</>
      }
    </motion.button>
  );
}
