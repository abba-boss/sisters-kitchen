import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostCard from '../../components/social/PostCard';
import { postService } from '../../services/postService';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    postService.getById(id)
      .then(({ data }) => setPost(data.data))
      .catch(() => {
        setPost(null);
        toast.error('Post not found');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <PageLoader />;
  if (!post) {
    return (
      <MainLayout>
        <div className="page-container page-shell">
          <ErrorState
            title="Post not found"
            message="This post doesn't exist or was removed."
            actionLabel="Back to Feed"
            actionTo="/feed"
            onRetry={load}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container page-shell max-w-xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-5">
          <Link to="/feed" className="hover:text-primary">Feed</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="text-brand-dark font-medium truncate max-w-[200px]">{post.vendor?.businessName}</span>
        </nav>
        <PostCard post={post} showVendor />
      </div>
    </MainLayout>
  );
}
