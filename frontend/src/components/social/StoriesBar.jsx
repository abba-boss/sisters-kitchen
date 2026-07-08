import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Eye, Play, Radio } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../utils/formatters';

export default function StoriesBar() {
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [viewer,   setViewer]   = useState(null); // { groupIdx, storyIdx }
  const scrollRef = useRef(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Public stories – no auth required
    storyService.getFeed()
      .then(({ data }) => setGroups(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StoriesBarSkeleton />;
  if (groups.length === 0) return null;

  const openViewer = (groupIdx, storyIdx = 0) => setViewer({ groupIdx, storyIdx });
  const closeViewer = () => setViewer(null);

  const markViewed = (story) => {
    if (isAuthenticated) storyService.view(story.id).catch(() => {});
  };

  return (
    <>
      {/* Stories scroll bar */}
      <div className="bg-white border-b border-orange-50 py-3 px-4">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory"
        >
          {groups.map((group, i) => (
            <StoryRing
              key={group.vendor.id}
              group={group}
              onClick={() => openViewer(i)}
            />
          ))}
        </div>
      </div>

      {/* Full-screen story viewer */}
      <AnimatePresence>
        {viewer && (
          <StoryViewer
            groups={groups}
            initialGroupIdx={viewer.groupIdx}
            initialStoryIdx={viewer.storyIdx}
            onClose={closeViewer}
            onView={markViewed}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Story Ring ──────────────────────────────────────────────────
function StoryRing({ group, onClick }) {
  const hasUnseen = group.hasUnseen !== false;
  const latestStory = group.stories?.[0];
  const hasVideo = group.stories?.some((story) => story.mediaType === 'video');

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0 group snap-start">
      <div className={`relative p-[2px] rounded-full transition-transform duration-300 group-hover:scale-105 ${hasUnseen
        ? 'bg-[conic-gradient(from_180deg_at_50%_50%,#FF7A59_0deg,#F9B24B_120deg,#E85D9A_240deg,#FF7A59_360deg)]'
        : 'bg-orange-100'
      }`}>
        <div className="w-16 h-16 rounded-full border-[3px] border-white overflow-hidden bg-brand-bg shadow-soft">
          {group.vendor.logo ? (
            <img src={group.vendor.logo} alt={group.vendor.businessName}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="font-bold text-primary text-lg">{group.vendor.businessName?.[0]}</span>
            </div>
          )}
        </div>
        {hasVideo && (
          <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-brand-dark text-white border-2 border-white flex items-center justify-center shadow-soft">
            <Play size={11} fill="currentColor" />
          </span>
        )}
        {latestStory?.link && (
          <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold border border-white shadow-soft inline-flex items-center gap-1">
            <Radio size={8} /> LIVE
          </span>
        )}
      </div>
      <span className={`text-xs text-center w-16 truncate leading-tight transition-colors ${hasUnseen ? 'text-brand-dark group-hover:text-primary font-semibold' : 'text-brand-muted'}`}>
        {group.vendor.businessName?.split(' ')[0]}
      </span>
    </button>
  );
}

// ── Full-screen viewer ──────────────────────────────────────────
function StoryViewer({ groups, initialGroupIdx, initialStoryIdx, onClose, onView }) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(initialStoryIdx);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const DURATION = 5000; // ms per story

  const group   = groups[groupIdx];
  const stories = group?.stories || [];
  const story   = stories[storyIdx];

  useEffect(() => {
    if (!story) return;
    onView?.(story);
    setProgress(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) next();
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [groupIdx, storyIdx]);

  const next = () => {
    clearInterval(timerRef.current);
    if (storyIdx < stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const prev = () => {
    clearInterval(timerRef.current);
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (groupIdx > 0) { setGroupIdx((i) => i - 1); setStoryIdx(0); }
  };

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      <div className="relative w-full max-w-sm h-full max-h-screen sm:max-h-[90vh] sm:rounded-2xl overflow-hidden">
        {/* Media */}
        {story.mediaType === 'video' ? (
          <video
            key={story.id}
            src={story.mediaUrl}
            autoPlay
            playsInline
            muted={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            key={story.id}
            src={story.mediaUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'; }}
          />
        )}

        {/* Dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/40" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Vendor header */}
        <div className="absolute top-7 left-3 right-12 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white">
            {group.vendor.logo
              ? <img src={group.vendor.logo} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{group.vendor.businessName?.[0]}</span>
                </div>
            }
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">{group.vendor.businessName}</p>
            <p className="text-white/70 text-xs mt-0.5">{timeAgo(story.createdAt)}</p>
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-7 right-3 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center z-10 hover:bg-white/30 transition-all">
          <X size={16} />
        </button>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-16 left-4 right-4 z-10">
            <p className="text-white text-sm text-center drop-shadow leading-relaxed">{story.caption}</p>
          </div>
        )}

        {/* CTA link */}
        {story.link && (
          <a href={story.link} target="_blank" rel="noreferrer"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white text-brand-dark text-xs font-semibold px-4 py-2 rounded-full shadow z-10 hover:bg-primary hover:text-white transition-all">
            <ExternalLink size={12} /> View →
          </a>
        )}

        {/* Views count */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white/70 text-xs z-10">
          <Eye size={12} /> {story.viewsCount}
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 flex z-5">
          <div className="flex-1" onClick={prev} />
          <div className="flex-1" onClick={next} />
        </div>
      </div>
    </motion.div>
  );
}

function StoriesBarSkeleton() {
  return (
    <div className="bg-white border-b border-orange-50 py-3 px-4">
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-16 rounded-full skeleton ring-2 ring-orange-100" />
            <div className="w-12 h-2.5 skeleton rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
