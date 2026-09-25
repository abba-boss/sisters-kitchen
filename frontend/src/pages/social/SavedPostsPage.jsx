import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Compass, Sparkles } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostCard from '../../components/social/PostCard';
import PostSkeleton from '../../components/social/PostSkeleton';
import { postService } from '../../services/postService';

export default function SavedPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    postService
      .getSaved({ page: 1, limit: 30 })
      .then(({ data }) => {
        if (!cancelled) setPosts(data.data || []);
      })
      .catch(() => {
        if (!cancelled) setError('We could not load your saved stories. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const removeSavedPost = (postId) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  return (
    <MainLayout>
      <div className="social-page-container page-container py-7 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <header className="mb-7">
            <p className="eyebrow mb-3">
              <Bookmark size={13} aria-hidden="true" />
              Your collection
            </p>
            <h1 className="heading-page">Saved stories</h1>
            <p className="section-subtitle max-w-2xl">
              Keep the recipes, kitchen stories, and dishes you want to return to in one place.
            </p>
          </header>

          {loading ? (
            <div className="space-y-5">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : error ? (
            <EmptyState
              icon={Sparkles}
              title="Your collection is resting"
              description={error}
            />
          ) : posts.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Use the bookmark on any feed post to keep it here for later."
            />
          ) : (
            <div className="space-y-5">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.2) }}
                >
                  <PostCard
                    post={{ ...post, _saved: true }}
                    onSaveChange={(postId, saved) => {
                      if (!saved) removeSavedPost(postId);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="surface-card px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h2 className="heading-section">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">{description}</p>
      <Link to="/" className="btn-primary mt-6 inline-flex items-center gap-2">
        <Compass size={16} aria-hidden="true" />
        Explore the feed
      </Link>
    </div>
  );
}
