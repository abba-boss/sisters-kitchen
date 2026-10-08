import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, ChefHat } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostCard from '../../components/social/PostCard';
import { postService } from '../../services/postService';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postService.getById(id)
      .then(({ data }) => setPost(data.data))
      .catch(() => toast.error('Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  if (!post) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center">
          <ChefHat size={40} className="text-brand-muted mx-auto mb-4" />
          <p className="text-brand-muted mb-4">Post not found or has been deleted.</p>
          <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand-muted hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={18} /> Back to Feed
        </button>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <PostCard post={post} />
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
