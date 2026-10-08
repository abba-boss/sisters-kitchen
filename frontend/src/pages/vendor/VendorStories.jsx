import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Radio, Trash2, Loader, Eye, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { storyService } from '../../services/storyService';
import { timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function VendorStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ caption: '', link: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  const loadStories = () => {
    setLoading(true);
    storyService.getMyStories()
      .then(({ data }) => setStories(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStories(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Please select an image or video'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('media', selectedFile);
      if (form.caption) fd.append('caption', form.caption);
      if (form.link)    fd.append('link', form.link);
      await storyService.create(fd);
      toast.success('Story published!');
      setShowForm(false);
      setForm({ caption: '', link: '' });
      setSelectedFile(null);
      loadStories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create story');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this story?')) return;
    try {
      await storyService.delete(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete story'); }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-poppins font-bold text-2xl text-brand-dark">Stories</h1>
            <p className="text-brand-muted text-sm">Stories expire after 24 hours</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Story
          </motion.button>
        </div>

        {/* Create form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5 mb-6"
          >
            <h3 className="font-semibold text-brand-dark mb-4">Create Story</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0])} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed transition-colors text-sm ${
                    selectedFile ? 'border-primary text-primary bg-primary/5' : 'border-orange-200 text-brand-muted hover:border-primary hover:text-primary'
                  }`}>
                  {selectedFile ? `📎 ${selectedFile.name}` : '+ Select photo or video'}
                </button>
              </div>
              <input
                type="text"
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                placeholder="Caption (optional)"
                className="input-field text-sm w-full"
              />
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="Link URL (optional) - e.g. your product page"
                className="input-field text-sm w-full"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-orange-100 text-brand-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                  {creating ? <Loader size={15} className="animate-spin" /> : null}
                  Publish Story
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Stories grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] skeleton rounded-[1.5rem]" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card text-center py-16 px-6">
            <Radio size={32} className="text-brand-muted mx-auto mb-3" />
            <p className="font-semibold text-brand-dark mb-1">No active stories</p>
            <p className="text-brand-muted text-sm">Share a story to connect with your followers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stories.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-[9/16] rounded-[1.5rem] overflow-hidden bg-brand-bg shadow-card group"
              >
                {story.mediaType === 'video' ? (
                  <video src={story.mediaUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {story.caption && (
                  <p className="absolute bottom-10 left-3 right-3 text-white text-xs line-clamp-2">{story.caption}</p>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white/80 text-xs">
                  <Eye size={11} /> {story.viewsCount || 0}
                  <Clock size={11} /> {timeAgo(story.createdAt)}
                </div>
                <button
                  onClick={() => handleDelete(story.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
