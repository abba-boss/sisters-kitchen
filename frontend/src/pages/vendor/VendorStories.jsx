import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, Camera, Upload, X, Loader, CheckCircle2, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/common/EmptyState';
import { storyService } from '../../services/storyService';
import { uploadImage } from '../../services/cloudinaryService';
import { timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function VendorStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  useEffect(() => { fetchStories(); }, []);
  const fetchStories = () => {
    storyService.getMyStories().then(({ data }) => setStories(data.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete story?')) return;
    try { await storyService.delete(id); setStories(p=>p.filter(s=>s.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };
  const isExpired = (s) => new Date(s.expiresAt) < new Date();
  const active  = stories.filter(s=>s.isActive&&!isExpired(s));
  const expired = stories.filter(s=>!s.isActive||isExpired(s));
  const timeLeft = (s) => { const d=new Date(s.expiresAt)-new Date(); if(d<=0) return 'Expired'; return `${String(Math.floor(d/3600000)).padStart(2,'0')}h ${String(Math.floor((d%3600000)/60000)).padStart(2,'0')}m`; };

  return (
    <DashboardLayout>
      {modal && <CreateStoryModal isOpen onClose={()=>setModal(false)} onCreated={(s)=>{setStories(p=>[s,...p]);setModal(false);}} />}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><h1 className="font-poppins font-bold text-xl text-brand-dark">Stories</h1><p className="text-brand-muted text-sm">{active.length} active · 24h expiry</p></div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2 py-2.5 text-sm"><Plus size={15}/>Add Story</button>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="aspect-[9/16] skeleton rounded-2xl"/>)}</div>
      ) : stories.length===0 ? (
        <EmptyState icon={Camera} title="No stories yet" message="Create a 24h story to engage followers!" actionLabel="Create Story" onAction={()=>setModal(true)}/>
      ) : (
        <div className="space-y-6">
          {active.length>0 && (
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-accent rounded-full animate-pulse"/>Active</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {active.map((s)=>(
                  <motion.div key={s.id} className="relative rounded-2xl overflow-hidden group cursor-pointer" style={{aspectRatio:'9/16'}}>
                    <img src={s.mediaUrl} alt="" className="w-full h-full object-cover" onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300';}}/>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50"/>
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-white text-xs bg-black/40 rounded-full px-2 py-0.5"><Eye size={9}/>{s.viewsCount}</div>
                    <div className="absolute bottom-2 left-2"><div className="flex items-center gap-1 text-white/70 text-xs"><Clock size={9}/>{timeLeft(s)}</div></div>
                    <button onClick={()=>handleDelete(s.id)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"><X size={11}/></button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {expired.length>0 && (
            <div className="opacity-50">
              <h2 className="font-semibold text-brand-muted text-sm mb-3">Expired</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {expired.map((s)=>(
                  <motion.div key={s.id} className="relative rounded-2xl overflow-hidden" style={{aspectRatio:'9/16'}}>
                    <img src={s.mediaUrl} alt="" className="w-full h-full object-cover" onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300';}}/>
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white text-xs font-semibold">Expired</span></div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function CreateStoryModal({ isOpen, onClose, onCreated }) {
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [url,       setUrl]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption,   setCaption]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef(null);

  const reset = () => { setFile(null); setPreview(null); setUrl(null); setCaption(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (fileRef.current) fileRef.current.value='';
    setFile(f); setPreview(URL.createObjectURL(f)); setUploading(true); setUrl(null);
    try { const u = await uploadImage(f,'sisters-kitchen/stories'); setUrl(u); }
    catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!preview) { toast.error('Select a photo'); return; }
    if (uploading) { toast.error('Wait for upload'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      if (url) fd.append('mediaUrl',url); else if (file) fd.append('media',file);
      if (caption.trim()) fd.append('caption',caption.trim());
      const { data } = await storyService.create(fd);
      toast.success('Story published! (24h)'); onCreated?.(data.data); handleClose();
    } catch (e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}/>
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-card-hover overflow-hidden z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-50">
          <h2 className="font-poppins font-bold text-brand-dark">Create Story</h2>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div onClick={()=>!preview&&fileRef.current?.click()}
            className={`relative rounded-2xl overflow-hidden bg-brand-bg flex items-center justify-center ${preview?'cursor-default':'cursor-pointer hover:bg-orange-100 border-2 border-dashed border-orange-200 hover:border-primary'}`}
            style={{aspectRatio:'9/16',maxHeight:300}}>
            {preview ? <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover"/> : <div className="text-center p-6"><Camera size={32} className="text-brand-muted mx-auto mb-2"/><p className="text-sm text-brand-dark font-medium">Tap to add photo</p></div>}
            {uploading && <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center"><Loader size={22} className="text-white animate-spin mb-1"/><p className="text-white text-sm">Uploading…</p></div>}
            {url && !uploading && <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent text-white text-xs font-semibold px-2 py-0.5 rounded-full"><CheckCircle2 size={11}/>Uploaded</div>}
            {preview && <button onClick={()=>{reset();fileRef.current?.click();}} className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center"><X size={13}/></button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
          <div>
            <label className="form-label">Caption (optional)</label>
            <textarea value={caption} onChange={e=>setCaption(e.target.value.slice(0,200))} rows={2} placeholder="What's happening in your kitchen? 🍳" className="input-field resize-none text-sm"/>
            <p className="text-xs text-right text-brand-muted mt-0.5">{caption.length}/200</p>
          </div>
          <p className="text-xs text-brand-muted text-center flex items-center justify-center gap-1"><Clock size={11}/> Story expires in 24 hours</p>
          <div className="flex gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1 py-3">Cancel</button>
            <button onClick={handleSave} disabled={!preview||uploading||saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
              {saving?<><Loader size={14} className="animate-spin"/>Publishing…</>:'✨ Publish Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
