import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostCard from '../../components/social/PostCard';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import { postService } from '../../services/postService';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postService.getById(id)
      .then(({ data }) => setPost(data.data))
      .catch(() => toast.error('Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  if (!post) return (
    <MainLayout>
      <div className="page-container py-20 text-center">
        <p className="text-brand-muted mb-4">This post doesn't exist or was removed.</p>
        <Link to="/feed" className="btn-primary">Back to Feed</Link>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="page-container py-6 max-w-2xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-5">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight size={14} />
          <Link to="/feed" className="hover:text-primary">Feed</Link>
          <ChevronRight size={14} />
          <span className="text-brand-dark font-medium line-clamp-1 max-w-[200px]">
            {post.vendor?.businessName}
          </span>
        </nav>
        <PostCard post={post} showVendor />
      </div>
    </MainLayout>
  );
}
