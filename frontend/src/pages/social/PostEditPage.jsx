import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { postService } from '../../services/postService';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

export default function PostEditPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ caption:'', status:'published', allowComments:true, tags:'' });

  useEffect(() => {
    postService.getById(id).then(({ data }) => {
      const p = data.data; setPost(p);
      setForm({ caption:p.caption||'', status:p.status||'published', allowComments:p.allowComments!==false, tags:(p.tags||[]).join(', ') });
    }).catch(() => toast.error('Not found')).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault(); if (!form.caption.trim()) { toast.error('Caption required'); return; }
    setSaving(true);
    try {
      await postService.update(id, { ...form, tags: JSON.stringify(form.tags.split(',').map(t=>t.trim()).filter(Boolean)) });
      toast.success('Post updated ✅'); navigate('/vendor/posts');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/posts" className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all"><ArrowLeft size={20}/></Link>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">Edit Post</h1>
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="card p-5 space-y-4">
            <div>
              <label className="form-label">Caption *</label>
              <textarea value={form.caption} onChange={e=>setForm(p=>({...p,caption:e.target.value.slice(0,2200)}))} rows={5} className="input-field resize-none" placeholder="Update your caption…"/>
              <p className="text-xs text-right text-brand-muted mt-0.5">{form.caption.length}/2200</p>
            </div>
            <div>
              <label className="form-label">Tags</label>
              <input type="text" value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} placeholder="spicy, lagos, new" className="input-field"/>
            </div>
            <div>
              <label className="form-label">Status</label>
              <div className="flex gap-2">
                {['published','draft','archived'].map(s=>(
                  <button key={s} type="button" onClick={()=>setForm(p=>({...p,status:s}))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${form.status===s?'bg-primary text-white':'bg-brand-bg text-brand-muted hover:bg-orange-100'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div><p className="text-sm font-medium text-brand-dark">Allow comments</p></div>
              <button type="button" onClick={()=>setForm(p=>({...p,allowComments:!p.allowComments}))}
                className={`relative w-11 h-6 rounded-full transition-all ${form.allowComments?'bg-primary':'bg-orange-100'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.allowComments?'left-5':'left-0.5'}`}/>
              </button>
            </div>
          </div>
          <div className="flex gap-3 pb-6">
            <Link to="/vendor/posts" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving?<><Loader size={15} className="animate-spin"/>Saving…</>:<><Save size={15}/>Update Post</>}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
