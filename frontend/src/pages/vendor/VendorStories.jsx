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
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchStories(); }, []);

  const fetchStories = () => {
    storyService.getMyStories()
      .then(({ data }) => setStories(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this story?')) return;
    try {
      await storyService.delete(id);
      setStories((p) => p.filter((s) => s.id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete story'); }
  };

  const isExpired = (s) => new Date(s.expiresAt) < new Date();
  const activeStories  = stories.filter((s) => s.isActive && !isExpired(s));
  const expiredStories = stories.filter((s) => !s.isActive || isExpired(s));

  return (
    <DashboardLayout>
      <CreateStoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(s) => { setStories((p) => [s, ...p]); }}
      />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">Stories</h1>
          <p className="text-brand-muted text-sm">24-hour stories · {activeStories.length} active</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 py-2.5 text-sm">
          <Plus size={16} /> Add Story
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] skeleton rounded-2xl" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No stories yet"
          message="Create a 24-hour story to engage your followers in real time!"
          actionLabel="Create Story"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Active stories */}
          {activeStories.length > 0 && (
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" /> Active Stories
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <AnimatePresence>
                  {activeStories.map((story, i) => (
                    <StoryCard key={story.id} story={story} onDelete={handleDelete} active />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Expired */}
          {expiredStories.length > 0 && (
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-3 text-brand-muted">Expired Stories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 opacity-50">
                {expiredStories.map((story) => (
                  <StoryCard key={story.id} story={story} onDelete={handleDelete} active={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function StoryCard({ story, onDelete, active }) {
  const timeLeft = () => {
    const diff = new Date(story.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m left`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative rounded-2xl overflow-hidden group cursor-pointer"
      style={{ aspectRatio: '9/16' }}
    >
      <img
        src={story.mediaUrl}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />

      {/* Ring */}
      {active && (
        <div className="absolute inset-0 border-2 border-primary rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Stats */}
      <div className="absolute top-2 left-2 flex items-center gap-1 text-white text-xs bg-black/40 rounded-full px-2 py-0.5">
        <Eye size={10} /> {story.viewsCount}
      </div>

      {/* Time */}
      <div className="absolute bottom-2 left-2 right-2">
        {story.caption && (
          <p className="text-white text-xs line-clamp-2 mb-1">{story.caption}</p>
        )}
        <div className="flex items-center gap-1 text-white/70 text-xs">
          <Clock size={9} /> {timeLeft()}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(story.id)}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
      >
        <X size={11} />
      </button>
    </motion.div>
  );
}

// ── Create Story Modal ───────────────────────────────────────────
function CreateStoryModal({ isOpen, onClose, onCreated }) {
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [url,      setUrl]      = useState(null);
  const [uploading,setUploading]= useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [caption,  setCaption]  = useState('');
  const [link,     setLink]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const fileRef = useRef(null);

  const reset = () => {
    setFile(null); setPreview(null); setUrl(null);
    setUploading(false); setUploaded(false);
    setCaption(''); setLink('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (fileRef.current) fileRef.current.value = '';
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploading(true); setUploaded(false); setUrl(null);
    try {
      const uploadedUrl = await uploadImage(f, 'sisters-kitchen/stories');
      setUrl(uploadedUrl); setUploaded(true);
    } catch { toast.error('Upload failed — will retry on save'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!preview) { toast.error('Please select a photo or video'); return; }
    if (uploading) { toast.error('Please wait for upload to finish'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      if (url) {
        fd.append('mediaUrl', url);
      } else if (file) {
        fd.append('media', file);
      }
      if (caption.trim()) fd.append('caption', caption.trim());
      if (link.trim())    fd.append('link',    link.trim());

      const { data } = await storyService.create(fd);
      toast.success('Story published! ✨ (expires in 24h)');
      onCreated?.(data.data);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create story');
    } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={  { opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-card-hover overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-orange-50">
                <h2 className="font-poppins font-bold text-brand-dark">Create Story</h2>
                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted"><X size={18} /></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Media preview / upload zone */}
                <div
                  onClick={() => !preview && fileRef.current?.click()}
                  className={`relative rounded-2xl overflow-hidden bg-brand-bg flex items-center justify-center cursor-pointer transition-all ${
                    preview ? 'cursor-default' : 'hover:bg-orange-100 border-2 border-dashed border-orange-200 hover:border-primary'
                  }`}
                  style={{ aspectRatio: '9/16', maxHeight: 320 }}
                >
                  {preview ? (
                    <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <Camera size={32} className="text-brand-muted mx-auto mb-2" />
                      <p className="text-sm font-medium text-brand-dark">Tap to add photo</p>
                      <p className="text-xs text-brand-muted mt-0.5">Supports JPG, PNG, WebP</p>
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                      <Loader size={24} className="text-white animate-spin mb-2" />
                      <p className="text-white text-sm">Uploading…</p>
                    </div>
                  )}
                  {uploaded && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-accent text-white text-xs font-semibold px-2 py-1 rounded-full">
                      <CheckCircle2 size={11} /> Uploaded
                    </div>
                  )}
                  {preview && (
                    <button
                      onClick={() => { reset(); fileRef.current?.click(); }}
                      className="absolute top-3 right-3 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

                {preview && (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium border border-primary/30 rounded-xl py-2 hover:bg-primary/5 transition-colors">
                    <Upload size={14} /> Change photo
                  </button>
                )}

                {/* Caption */}
                <div>
                  <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Caption (optional)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 200))}
                    placeholder="What's happening in your kitchen? 🍳"
                    rows={2}
                    className="w-full border border-orange-100 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                  <p className="text-xs text-right text-brand-muted mt-0.5">{caption.length}/200</p>
                </div>

                {/* Link */}
                <div>
                  <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Link (optional) — e.g. your product</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://…"
                    className="w-full border border-orange-100 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>

                <p className="text-xs text-brand-muted text-center flex items-center justify-center gap-1">
                  <Clock size={11} /> Story expires automatically in 24 hours
                </p>

                <div className="flex gap-3">
                  <button onClick={handleClose} className="btn-secondary flex-1 py-3">Cancel</button>
                  <button
                    onClick={handleSave}
                    disabled={!preview || uploading || saving}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <><Loader size={15} className="animate-spin" /> Publishing…</>
                    ) : (
                      '✨ Publish Story'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
