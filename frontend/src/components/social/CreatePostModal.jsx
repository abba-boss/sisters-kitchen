import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus, Upload, Loader, CheckCircle2, Tag, MapPin, ShoppingBag } from 'lucide-react';
import { postService } from '../../services/postService';
import { uploadImage } from '../../services/cloudinaryService';
import { useFeedStore } from '../../store/feedStore';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'image',          label: '📸 Photo',          desc: 'Share a food photo'          },
  { value: 'text',           label: '✍️ Text',            desc: 'Share a thought'             },
  { value: 'promotion',      label: '🔥 Promotion',       desc: 'Announce a deal or offer'    },
  { value: 'availability',   label: '✅ Availability',    desc: "Today's menu availability"   },
  { value: 'announcement',   label: '📢 Announcement',    desc: 'Share news'                  },
  { value: 'behind_scenes',  label: '🎬 Behind the Scenes', desc: 'Kitchen moments'          },
  { value: 'recipe',         label: '📖 Recipe',          desc: 'Share a recipe'              },
  { value: 'customer_highlight', label: '⭐ Customer Love', desc: 'Highlight a happy customer' },
];

export default function CreatePostModal({ isOpen, onClose, onCreated }) {
  const [step,      setStep]      = useState(1); // 1=type, 2=content
  const [type,      setType]      = useState('image');
  const [caption,   setCaption]   = useState('');
  const [tags,      setTags]      = useState('');
  const [location,  setLocation]  = useState('');
  const [mediaSlots, setMediaSlots] = useState([]); // { src, file, url, uploading, done }
  const [saving,    setSaving]    = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const fileRef = useRef(null);
  const { prependPost } = useFeedStore();

  const resetForm = () => {
    setStep(1); setType('image'); setCaption(''); setTags('');
    setLocation(''); setMediaSlots([]); setAllowComments(true);
  };

  const handleClose = () => { resetForm(); onClose?.(); };

  // Image picking
  const handleFilePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (fileRef.current) fileRef.current.value = '';

    const remaining = 10 - mediaSlots.length;
    const toAdd = files.slice(0, remaining);

    const newSlots = toAdd.map((file) => ({
      src: URL.createObjectURL(file),
      file,
      url: null,
      uploading: true,
      done: false,
    }));
    setMediaSlots((prev) => [...prev, ...newSlots]);

    // Upload to Cloudinary
    for (let i = 0; i < toAdd.length; i++) {
      const slotIndex = mediaSlots.length + i;
      try {
        const url = await uploadImage(toAdd[i], 'sisters-kitchen/posts');
        setMediaSlots((prev) =>
          prev.map((s, idx) => idx === slotIndex ? { ...s, url, uploading: false, done: true } : s)
        );
      } catch {
        setMediaSlots((prev) =>
          prev.map((s, idx) => idx === slotIndex ? { ...s, uploading: false, done: false } : s)
        );
        toast.error(`Image ${i + 1} upload failed`);
      }
    }
  };

  const removeSlot = (i) => {
    setMediaSlots((prev) => {
      const copy = [...prev];
      if (copy[i].src?.startsWith('blob:')) URL.revokeObjectURL(copy[i].src);
      copy.splice(i, 1);
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!caption.trim()) { toast.error('Please add a caption'); return; }
    const uploading = mediaSlots.some((s) => s.uploading);
    if (uploading) { toast.error('Please wait for images to finish uploading'); return; }

    setSaving(true);
    try {
      const uploadedUrls = mediaSlots.filter((s) => s.done && s.url).map((s) => s.url);
      const failedFiles  = mediaSlots.filter((s) => !s.done && s.file);

      const fd = new FormData();
      fd.append('caption', caption.trim());
      fd.append('type',    type);
      fd.append('allowComments', String(allowComments));
      fd.append('tags', JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)));
      if (location.trim()) fd.append('location', location.trim());
      if (uploadedUrls.length) fd.append('mediaUrls', JSON.stringify(uploadedUrls));
      failedFiles.forEach(({ file }) => fd.append('media', file));

      const { data } = await postService.create(fd);
      prependPost(data.data);
      toast.success('Post published! 🎉');
      onCreated?.(data.data);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally { setSaving(false); }
  };

  const charCount = caption.length;
  const charMax   = 2200;

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
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-card-hover overflow-hidden max-h-[95vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-orange-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {step === 2 && (
                    <button onClick={() => setStep(1)} className="text-brand-muted hover:text-brand-dark transition-colors text-sm font-medium">
                      ← Back
                    </button>
                  )}
                  <h2 className="font-poppins font-bold text-brand-dark text-base">
                    {step === 1 ? 'Choose Post Type' : 'Create Post'}
                  </h2>
                </div>
                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 scrollbar-hide">

                {/* ── STEP 1: Type selection ───────── */}
                {step === 1 && (
                  <div className="p-5 grid grid-cols-2 gap-3">
                    {POST_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => { setType(pt.value); setStep(2); }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                          type === pt.value ? 'border-primary bg-primary/5' : 'border-orange-100 bg-white'
                        }`}
                      >
                        <div className="text-xl mb-1.5">{pt.label.split(' ')[0]}</div>
                        <p className="text-xs font-semibold text-brand-dark leading-tight">{pt.label.slice(2)}</p>
                        <p className="text-xs text-brand-muted mt-0.5">{pt.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── STEP 2: Content ──────────────── */}
                {step === 2 && (
                  <div className="p-5 space-y-4">

                    {/* Images (only for image/promotion/etc.) */}
                    {type !== 'text' && (
                      <div>
                        <label className="text-xs font-semibold text-brand-dark mb-2 block flex items-center gap-1">
                          <ImagePlus size={13} /> Photos / Videos
                          <span className="text-brand-muted font-normal ml-1">({mediaSlots.length}/10)</span>
                        </label>
                        <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFilePick} className="hidden" />
                        <div className="flex flex-wrap gap-2">
                          <AnimatePresence>
                            {mediaSlots.map((slot, i) => (
                              <motion.div
                                key={slot.src}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 group flex-shrink-0"
                                style={{ borderColor: slot.done ? '#5FA36A' : slot.uploading ? '#FF7A59' : '#FDE8DC' }}
                              >
                                <img src={slot.src} alt="" className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100'; }} />
                                {slot.uploading && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader size={16} className="text-white animate-spin" />
                                  </div>
                                )}
                                {slot.done && (
                                  <div className="absolute top-1 left-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow">
                                    <CheckCircle2 size={11} className="text-white" />
                                  </div>
                                )}
                                {i === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-white text-xs bg-primary/70 py-0.5">Cover</span>}
                                {!slot.uploading && (
                                  <button onClick={() => removeSlot(i)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={10} />
                                  </button>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {mediaSlots.length < 10 && (
                            <button onClick={() => fileRef.current?.click()}
                              className="w-20 h-20 rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all flex-shrink-0 group">
                              <Upload size={18} className="text-brand-muted group-hover:text-primary mb-1" />
                              <span className="text-xs text-brand-muted">Upload</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Caption */}
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1.5 block">
                        Caption <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value.slice(0, charMax))}
                        placeholder="Share what's cooking… add emojis, describe the dish, tag customers 🍽️"
                        rows={4}
                        className="w-full border border-orange-100 bg-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                      />
                      <p className={`text-xs text-right mt-0.5 ${charCount > charMax * 0.9 ? 'text-primary' : 'text-brand-muted'}`}>
                        {charCount}/{charMax}
                      </p>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1.5 flex items-center gap-1">
                        <Tag size={11} /> Tags <span className="text-brand-muted font-normal">(comma separated)</span>
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="jollof, spicy, lagos, new"
                        className="w-full border border-orange-100 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-xs font-semibold text-brand-dark mb-1.5 flex items-center gap-1">
                        <MapPin size={11} /> Location <span className="text-brand-muted font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Yaba, Lagos"
                        className="w-full border border-orange-100 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>

                    {/* Allow comments toggle */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-brand-dark">Allow comments</p>
                        <p className="text-xs text-brand-muted">Let customers engage with this post</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowComments(!allowComments)}
                        className={`relative w-11 h-6 rounded-full transition-all ${allowComments ? 'bg-primary' : 'bg-orange-100'}`}
                      >
                        <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow ${allowComments ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {step === 2 && (
                <div className="px-5 py-4 border-t border-orange-50 flex-shrink-0">
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !caption.trim() || mediaSlots.some((s) => s.uploading)}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                  >
                    {saving ? (
                      <><Loader size={16} className="animate-spin" />Publishing…</>
                    ) : mediaSlots.some((s) => s.uploading) ? (
                      <><Loader size={16} className="animate-spin" />Uploading images…</>
                    ) : (
                      '✨ Publish Post'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
