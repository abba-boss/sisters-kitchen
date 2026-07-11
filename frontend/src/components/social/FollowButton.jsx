import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck, Loader } from 'lucide-react';
import { followerService } from '../../services/followerService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import toast from 'react-hot-toast';

/**
 * Reusable follow button for any vendor.
 * Usage: <FollowButton vendorId="..." size="sm|md" variant="outline|fill" />
 */
export default function FollowButton({ vendorId, size = 'md', variant = 'fill', className = '' }) {
  const { isAuthenticated, user } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);

  const [following,   setFollowing]   = useState(false);
  const [count,       setCount]       = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !vendorId) return;
    followerService.getStatus(vendorId)
      .then(({ data }) => {
        setFollowing(data.data.following);
        setCount(data.data.followersCount);
      })
      .catch(() => {})
      .finally(() => setInitialized(true));
  }, [vendorId, isAuthenticated]);

  const handle = async () => {
    if (!isAuthenticated) { openAuth('Sign in to follow this vendor'); return; }
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await followerService.toggle(vendorId);
      setFollowing(data.following);
      setCount((c) => data.following ? c + 1 : Math.max(c - 1, 0));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1',
    md: 'text-sm px-4 py-2 gap-1.5',
  };

  const baseClass = `inline-flex items-center font-semibold rounded-full transition-all ${sizeClasses[size]} ${className}`;

  const variantClass = following
    ? 'bg-brand-bg text-brand-muted border border-orange-100 hover:border-red-300 hover:text-red-500'
    : variant === 'fill'
      ? 'bg-primary text-white hover:bg-primary-dark shadow-soft'
      : 'border-2 border-primary text-primary hover:bg-primary hover:text-white';

  if (!initialized && isAuthenticated) {
    return (
      <div className={`${baseClass} ${variantClass} opacity-50`}>
        <Loader size={size === 'sm' ? 12 : 14} className="animate-spin" />
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handle}
      disabled={loading}
      className={`${baseClass} ${variantClass}`}
    >
      {loading ? (
        <Loader size={size === 'sm' ? 12 : 14} className="animate-spin" />
      ) : following ? (
        <><UserCheck size={size === 'sm' ? 12 : 14} />Following</>
      ) : (
        <><UserPlus size={size === 'sm' ? 12 : 14} />Follow</>
      )}
    </motion.button>
  );
}
