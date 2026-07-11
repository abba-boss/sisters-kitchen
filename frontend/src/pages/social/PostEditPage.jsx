import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { postService } from '../../services/postService';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import PostMediaGallery from '../../components/social/PostMediaGallery';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value:'image',          label:'📸 Photo'            },
  { value:'text',           label:'✍️ Text'              },
  { value:'promotion',      label:'🔥 Promotion'         },
  { value:'availability',   label:'✅ Availability'      },
  { value:'announcement',   label:'📢 Announcement'      },
  { value:'behind_scenes',  label:'🎬 Behind the Scenes' },
  { value:'recipe',         label:'📖 Recipe'            },
  { value:'customer_highlight', label:'⭐ Customer Love' },
];

export default function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ caption:'', type:'image', tags:'', location:'', allowComments:true, status:'published' });

  useEffect(() => {
    postService.getById(id)
      .then(({ data }) => {
        const p = data.data;
        setPost(p);
        setForm({
          caption:       p.caption || '',
          type:          p.type || 'image',
          tags:          (p.tags || []).join(', '),
          location:      p.location || '',
          allowComments: p.allowComments !== false,
          status:        p.status || 'published',
        });
      })
      .catch(() => toast.error('Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.caption.trim()) { toast.error('Caption is required'); return; }
    setSaving(true);
    try {
      await postService.update(id, {
        ...form,
        tags: JSON.stringify(form.tags.split(',').map(t=>t.trim()).filter(Boolean)),
      });
      toast.success('Post updated! ✅');
      navigate('/vendor/posts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update post');
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  if (!post) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <p className="text-brand-muted mb-4">Post not found.</p>
        <Link to="/vendor/posts" className="btn-primary">Back to Posts</Link>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/posts" className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-poppins font-bold text-xl text-brand-dark">Edit Post</h1>
            <p className="text-brand-muted text-sm">Update your post details</p>
          </div>
        </div>

        {/* Media preview (read-only) */}
        {post.media?.length > 0 && (
          <div className="card overflow-hidden mb-5 max-h-72">
            <PostMediaGallery media={post.media} />
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-brand-dark text-sm">Post Details</h2>

            {/* Type */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Post Type</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="input-field">
                {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Caption <span className="text-red-500">*</span></label>
              <textarea
                value={form.caption}
                onChange={e=>setForm(p=>({...p,caption:e.target.value.slice(0,2200)}))}
                rows={5}
                className="input-field resize-none"
                placeholder="Update your caption…"
              />
              <p className="text-xs text-right text-brand-muted mt-0.5">{form.caption.length}/2200</p>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Tags <span className="text-brand-muted font-normal">(comma separated)</span></label>
              <input type="text" value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))}
                placeholder="spicy, lagos, new" className="input-field" />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Location</label>
              <input type="text" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}
                placeholder="Yaba, Lagos" className="input-field" />
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-brand-dark text-sm">Settings</h2>
            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Status</label>
              <div className="flex gap-2">
                {['published','draft','archived'].map(s => (
                  <button key={s} type="button" onClick={()=>setForm(p=>({...p,status:s}))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${form.status===s ? 'bg-primary text-white' : 'bg-brand-bg text-brand-muted hover:bg-orange-100'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Allow comments */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-brand-dark">Allow comments</p>
                <p className="text-xs text-brand-muted">Let customers engage</p>
              </div>
              <button type="button" onClick={()=>setForm(p=>({...p,allowComments:!p.allowComments}))}
                className={`relative w-11 h-6 rounded-full transition-all ${form.allowComments ? 'bg-primary' : 'bg-orange-100'}`}>
                <motion.div layout transition={{ type:'spring', stiffness:500, damping:20 }}
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow ${form.allowComments ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pb-6">
            <Link to="/vendor/posts" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><Loader size={15} className="animate-spin"/>Saving…</> : <><Save size={15}/>Update Post</>}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
