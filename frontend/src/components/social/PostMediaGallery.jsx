import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Maximize2, X, Volume2, VolumeX } from 'lucide-react';
import OptimizedImage, { FALLBACK_IMAGE } from '../common/OptimizedImage';

const MEDIA_FALLBACK = FALLBACK_IMAGE.replace('w=400', 'w=600');

export default function PostMediaGallery({ media }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [muted, setMuted] = useState(true);

  if (!media || media.length === 0) return null;

  const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder);
  const current_ = sorted[current];
  const isVideo = current_?.type === 'video';
  const count = sorted.length;

  const prev = (e) => {
    e?.stopPropagation();
    setCurrent((c) => (c - 1 + count) % count);
  };
  const next = (e) => {
    e?.stopPropagation();
    setCurrent((c) => (c + 1) % count);
  };

  return (
    <>
      <div
        className="relative bg-black overflow-hidden rounded-[1.5rem] mx-4"
        style={{ aspectRatio: '4/3', maxHeight: 560 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {isVideo ? (
              <video
                src={current_.url}
                poster={current_.thumbnailUrl}
                autoPlay
                loop
                muted={muted}
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <OptimizedImage
                src={current_.url}
                alt={current_.altText || 'Post image'}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-700 hover:scale-[1.03]"
                onClick={() => setLightbox(true)}
                fallback={MEDIA_FALLBACK}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/45 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all z-10"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/45 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all z-10"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}

        {!isVideo && (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Expand image"
            className="absolute top-3 right-3 w-8 h-8 bg-black/45 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all z-10"
          >
            <Maximize2 size={13} aria-hidden="true" />
          </button>
        )}

        {isVideo && (
          <>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="absolute top-3 right-3 w-8 h-8 bg-black/45 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all z-10"
            >
              {muted ? <VolumeX size={13} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
            </button>
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-white/85 backdrop-blur-sm text-brand-dark text-xs font-semibold px-2.5 py-1 rounded-full z-10">
              <Play size={11} fill="currentColor" aria-hidden="true" /> Cooking video
            </div>
          </>
        )}

        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {count > 1 && (
          <span className="absolute top-3 left-3 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
            {current + 1}/{count}
          </span>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 z-10"
            >
              <X size={20} aria-hidden="true" />
            </button>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 z-10"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 z-10"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </>
            )}
            <OptimizedImage
              src={sorted[current].url}
              alt={sorted[current].altText || 'Post image'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              loading="eager"
              onClick={(e) => e.stopPropagation()}
              fallback={MEDIA_FALLBACK}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
