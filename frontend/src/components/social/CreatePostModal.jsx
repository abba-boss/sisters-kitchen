import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, ImagePlus, Send, Loader, Tag, MapPin,
  Flame, CheckCircle, Megaphone, BookOpen, Video, Star
} from 'lucide-react';
import { postService } from '../../services/postService';
import { useFeedStore } from '../../store/feedStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'image',         label: 'Photo',          icon: ImagePlus,  color: 'text-blue-500   bg-blue-50'   },
  { value: 'promotion',     label: 'Promotion 🔥',   icon: Flame,      color: 'text-primary    bg-primary/10' },
  { value: 'availability',  label: 'Available ✅',   icon: CheckCircle,color: 'text-accent     bg-accent/10' },
  { value: 'announcement',  label: 'Announce 📢',    icon: Megaphone,  color: 'text-orange-500 bg-orange-50' },
  { value: 'recipe',        label: 'Recipe 📖',      icon: BookOpen,   color: 'text-yellow-600 bg-yellow-50' },
  { value: 'behind_scenes', label: 'BTS 🎬',         icon: Video,      color: 'text-purple-600 bg-purple-50' },
  { value: 'customer_highlight', label: 'Review ⭐', icon: Star,       color: 'text-pink-500   bg-pink-50'   },
];

export default function CreatePostModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuthStore();
  const { prependPost } = useFeedStore();
  const fileRef = useRef(null);

  const [caption, setCaption]     = useState('');
  const [type, setType]           = useState('image');
  const [tags, setTags]           = useState('');
  const [location, setLocation]   = useState('');
  const [files, setFiles]         = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, 5);
    setFiles(picked);
    setPreviews(picked.map((f) => URL.createObjectURL(f)));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (i) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && files.length === 0) {
      toast.error('Add a caption or photo'); return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('caption', caption.trim());
      fd.append('type', type);
      if (location.trim()) fd.append('location', location.trim());
      if (tags.trim()) {
        fd.append('tags', JSON.stringify(
          tags.split(',').map((t) => t.trim()).filter(Boolean)
        ));
      }
      files.forEach((f) => fd.append('media', f));

      const { data } = await postService.create(fd);
      prependPost(data.data);
      toast.success('Post published! 🎉');
      onCreated?.(data.data);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setCaption(''); setType('image'); setTags('');
    setLocation(''); setFiles([]); setPreviews([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-card-hover max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-orange-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                : <span className="font-bold text-primary text-sm">{user?.firstName?.[0]}</span>}
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-dark">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-brand-muted">Creating a post</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Post type */}
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Post Type</p>
            <div className="flex gap-2 flex-wrap">
              {POST_TYPES.map(({ value, label, color }) => (
                <button key={value} type="button"
                  onClick={() => setType(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${
                    type === value
                      ? `${color} border-current shadow-soft`
                      : 'bg-brand-bg text-brand-muted border-transparent hover:border-orange-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            placeholder="What's cooking? Share a food update, recipe, or special offer…"
            className="w-full border border-orange-100 rounded-2xl px-4 py-3 text-sm text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
          />

          {/* Media previews */}
          {previews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {previews.map((src, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={src} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-orange-200 flex items-center justify-center text-brand-muted hover:border-primary hover:text-primary transition-colors">
                  <ImagePlus size={20} />
                </button>
              )}
            </div>
          )}

          {/* Add media button */}
          {previews.length === 0 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-orange-200 text-brand-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium">
              <ImagePlus size={18} /> Add Photos / Videos (up to 5)
            </button>
          )}
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />

          {/* Tags + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags: rice, fresh…"
                  className="input-field pl-9 text-sm py-2.5" />
              </div>
            </div>
            <div>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location…"
                  className="input-field pl-9 text-sm py-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-orange-50 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={submitting || (!caption.trim() && files.length === 0)}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-60"
          >
            {submitting
              ? <><Loader size={16} className="animate-spin" /> Publishing…</>
              : <><Send size={16} /> Publish Post</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
