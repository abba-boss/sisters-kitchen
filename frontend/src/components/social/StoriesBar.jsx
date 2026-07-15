import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Clock } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../utils/formatters';

export default function StoriesBar() {
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer,  setViewer]  = useState(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    storyService.getFeed()
      .then(({ data }) => setGroups(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StoriesSkeleton />;
  if (groups.length === 0) return null;

  const markViewed = (story) => { if (isAuthenticated) storyService.view(story.id).catch(() => {}); };

  return (
    <>
      <div className="bg-white border-b border-orange-50 py-3 px-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-0.5 max-w-7xl mx-auto">
          {groups.map((group, i) => (
            <StoryRing key={group.vendor?.id} group={group} onClick={() => setViewer({ groupIdx: i, storyIdx: 0 })} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {viewer && (
          <StoryViewer groups={groups} initialGroupIdx={viewer.groupIdx} initialStoryIdx={viewer.storyIdx}
            onClose={() => setViewer(null)} onView={markViewed} />
        )}
      </AnimatePresence>
    </>
  );
}

function StoryRing({ group, onClick }) {
  const unseen = group.hasUnseen !== false;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
      <div className={`p-0.5 rounded-full ${unseen ? 'bg-gradient-to-tr from-primary via-orange-400 to-yellow-400' : 'bg-orange-100'}`}>
        <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-brand-bg">
          {group.vendor?.logo
            ? <img src={group.vendor.logo} alt={group.vendor.businessName} className="w-full h-full object-cover"/>
            : <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary text-lg">{group.vendor?.businessName?.[0]}</span>
              </div>
          }
        </div>
      </div>
      <span className="text-xs text-brand-muted w-16 truncate text-center leading-tight group-hover:text-primary transition-colors">
        {group.vendor?.businessName?.split(' ')[0]}
      </span>
    </button>
  );
}

function StoryViewer({ groups, initialGroupIdx, initialStoryIdx, onClose, onView }) {
  const [gIdx, setGIdx] = useState(initialGroupIdx);
  const [sIdx, setSIdx] = useState(initialStoryIdx);
  const [pct,  setPct]  = useState(0);
  const DURATION = 5000;

  const group   = groups[gIdx];
  const stories = group?.stories || [];
  const story   = stories[sIdx];

  useEffect(() => {
    if (!story) return;
    onView?.(story);
    setPct(0);
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(((Date.now()-start)/DURATION)*100, 100);
      setPct(p);
      if (p >= 100) next();
    }, 50);
    return () => clearInterval(id);
  }, [gIdx, sIdx]);

  const next = () => {
    if (sIdx < stories.length-1) setSIdx(i=>i+1);
    else if (gIdx < groups.length-1) { setGIdx(i=>i+1); setSIdx(0); }
    else onClose();
  };
  const prev = () => { if (sIdx>0) setSIdx(i=>i-1); else if (gIdx>0) { setGIdx(i=>i-1); setSIdx(0); } };

  if (!story) return null;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full max-h-screen sm:rounded-2xl sm:max-h-[90vh] overflow-hidden">
        {story.mediaType==='video'
          ? <video key={story.id} src={story.mediaUrl} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"/>
          : <img key={story.id} src={story.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover"
              onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';}} />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/40"/>

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {stories.map((_,i)=>(
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-none" style={{width: i<sIdx?'100%':i===sIdx?`${pct}%`:'0%'}}/>
            </div>
          ))}
        </div>

        {/* Vendor header */}
        <div className="absolute top-7 left-3 right-12 flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white">
            {group.vendor?.logo ? <img src={group.vendor.logo} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><span className="text-white font-bold text-sm">{group.vendor?.businessName?.[0]}</span></div>}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{group.vendor?.businessName}</p>
            <p className="text-white/70 text-xs">{timeAgo(story.createdAt)}</p>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-7 right-3 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center z-10">
          <X size={15}/>
        </button>

        {story.caption && (
          <div className="absolute bottom-16 left-4 right-4 z-10">
            <p className="text-white text-sm text-center drop-shadow leading-relaxed">{story.caption}</p>
          </div>
        )}

        {story.link && (
          <a href={story.link} target="_blank" rel="noreferrer"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-brand-dark text-xs font-bold px-4 py-2 rounded-full shadow z-10 hover:bg-primary hover:text-white transition-all">
            View →
          </a>
        )}

        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white/60 text-xs z-10">
          <Eye size={11}/>{story.viewsCount}
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 flex z-5">
          <div className="flex-1" onClick={prev}/>
          <div className="flex-1" onClick={next}/>
        </div>
      </div>
    </motion.div>
  );
}

function StoriesSkeleton() {
  return (
    <div className="bg-white border-b border-orange-50 py-3 px-4">
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-14 h-14 rounded-full skeleton"/>
            <div className="w-12 h-2.5 skeleton rounded-full"/>
          </div>
        ))}
      </div>
    </div>
  );
}
