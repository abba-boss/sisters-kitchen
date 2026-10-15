import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { postService } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'promotion',      label: '🔥 Promotion'       },
  { value: 'availability',   label: '✅ Availability'     },
  { value: 'announcement',   label: '📢 Announcement'     },
  { value: 'behind_scenes',  label: '🎬 Behind the Scenes' },
  { value: 'recipe',         label: '📖 Recipe'            },
  { value: 'customer_highlight', label: '⭐ Customer Highlight' },
];

export default function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ caption: '', type: 'announcement', tags: '' });

  useEffect(() => {
    postService.getById(id)
      .then(({ data }) => {
        const p = data.data;
        setPost(p);
        setForm({
          caption: p.caption || '',
          type:    p.type    || 'announcement',
          tags:    (p.tags || []).join(', '),
        });
      })
      .catch(() => toast.error('Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body = {
        caption: form.caption.trim(),
        type:    form.type,
        tags:    form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      await postService.update(id, body);
      toast.success('Post updated!');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!post) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center">
          <p className="text-brand-muted">Post not found.</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go Back</button>
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
          <ArrowLeft size={18} /> Back
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card p-6">
            <h1 className="font-poppins font-bold text-2xl text-brand-dark mb-6">Edit Post</h1>

            <div className="space-y-5">
              {/* Post type */}
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-2">Post Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POST_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: value }))}
                      className={`px-4 py-2.5 rounded-2xl text-sm font-medium text-left transition-all ${
                        form.type === value
                          ? 'bg-primary text-white shadow-soft'
                          : 'bg-brand-bg border border-orange-100 text-brand-muted hover:border-primary/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-2">Caption</label>
                <textarea
                  value={form.caption}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  rows={5}
                  placeholder="Write a caption for your post…"
                  className="input-field resize-none text-sm w-full"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. jollof, rice, homemade"
                  className="input-field text-sm w-full"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
