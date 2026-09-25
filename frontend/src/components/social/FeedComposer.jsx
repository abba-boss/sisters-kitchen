import { Link } from 'react-router-dom';
import { ImagePlus, Smile, PenLine, ArrowRight, ChefHat } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useCreatePostStore } from '../../store/createPostStore';

export default function FeedComposer() {
  const { isAuthenticated, user } = useAuthStore();
  const openAuth = useAuthModalStore((state) => state.open);
  const openComposer = useCreatePostStore((state) => state.open);
  const isVendor = user?.role === 'vendor';

  const handleCreate = () => {
    if (!isAuthenticated) {
      openAuth('Sign in to share your food story');
      return;
    }
    if (isVendor) openComposer();
  };

  if (isAuthenticated && !isVendor) {
    return (
      <div className="surface-card mb-5 flex items-center gap-3 p-3.5 sm:p-4">
        <Avatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-dark">
            Find your next favorite meal
          </p>
          <p className="text-xs text-brand-muted">Follow kitchens and keep the stories that inspire you.</p>
        </div>
        <Link
          to="/vendors"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-brand-bg px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Explore
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="surface-card mb-5 p-3.5 sm:p-4">
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <button
          type="button"
          onClick={handleCreate}
          className="min-w-0 flex-1 rounded-2xl border border-orange-100 bg-brand-bg/60 px-4 py-3 text-left text-sm text-brand-muted transition-colors hover:border-primary/30 hover:bg-white hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {isVendor ? "Share what's cooking today..." : 'Sign in to join the food conversation'}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-orange-50 pt-2.5 sm:ml-[52px]">
        <ComposerAction icon={ImagePlus} label="Photo" onClick={handleCreate} />
        <ComposerAction icon={Smile} label="Feeling" onClick={handleCreate} />
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] font-medium text-brand-muted sm:flex">
          <PenLine size={12} aria-hidden="true" />
          Verified kitchens publish
        </span>
      </div>
    </div>
  );
}

function Avatar({ user }) {
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/10">
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
      ) : user?.firstName ? (
        user.firstName[0].toUpperCase()
      ) : (
        <ChefHat size={18} aria-hidden="true" />
      )}
    </div>
  );
}

function ComposerAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold text-brand-muted transition-colors hover:bg-brand-bg hover:text-primary sm:flex-none sm:px-3"
    >
      <Icon size={16} className="text-primary" aria-hidden="true" />
      {label}
    </button>
  );
}
