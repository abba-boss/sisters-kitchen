import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Loader, Pencil, Trash2, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PostCard from '../../components/social/PostCard';
import PostSkeleton from '../../components/social/PostSkeleton';
import { postService } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: '',              label: 'All' },
  { value: 'promotion',     label: '🔥 Promotions' },
  { value: 'availability',  label: '✅ Availability' },
  { value: 'announcement',  label: '📢 Announcements' },
  { value: 'behind_scenes', label: '🎬 Behind Scenes' },
  { value: 'recipe',        label: '📖 Recipes' },
];

export default function VendorPosts() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ caption: '', type: 'announcement', tags: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  const loadPosts = () => {
    setLoading(true);
    postService.getMyPosts({ limit: 30 })
      .then(({ data }) => setPosts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPosts(); }, []);

  const filtered = typeFilter ? posts.filter((p) => p.type === typeFilter) : posts;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.caption.trim()) { toast.error('Caption is required'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('caption', form.caption.trim());
      fd.append('type', form.type);
      if (form.tags) fd.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)));
      if (selectedFile) fd.append('media', selectedFile);
      await postService.create(fd);
      toast.success('Post published!');
      setShowCreate(false);
      setForm({ caption: '', type: 'announcement', tags: '' });
      setSelectedFile(null);
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-poppins font-bold text-2xl text-brand-dark">Your Posts</h1>
            <p className="text-brand-muted text-sm">{posts.length} posts published</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Create Post
          </motion.button>
        </div>

        {/* Create form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5 mb-6"
          >
            <h3 className="font-semibold text-brand-dark mb-4">Create New Post</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {POST_TYPES.slice(1).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: value }))}
                    className={`px-3 py-2 rounded-xl text-sm font-medium text-left transition-all ${
                      form.type === value ? 'bg-primary text-white' : 'bg-brand-bg border border-orange-100 text-brand-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                rows={4}
                placeholder="Write your post caption…"
                required
                className="input-field resize-none text-sm w-full"
              />
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="Tags: rice, homemade, fresh (comma separated)"
                className="input-field text-sm w-full"
              />
              <div>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0])} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-orange-200 text-brand-muted hover:border-primary hover:text-primary transition-colors text-sm">
                  {selectedFile ? `📎 ${selectedFile.name}` : '+ Add photo or video'}
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-orange-100 text-brand-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                  {creating ? <Loader size={15} className="animate-spin" /> : null}
                  Publish
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
          {POST_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                typeFilter === value ? 'bg-primary text-white' : 'bg-white border border-orange-100 text-brand-muted hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card text-center py-16 px-6">
            <FileText size={32} className="text-brand-muted mx-auto mb-3" />
            <p className="font-semibold text-brand-dark mb-1">No posts yet</p>
            <p className="text-brand-muted text-sm">Create your first post to connect with customers.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
