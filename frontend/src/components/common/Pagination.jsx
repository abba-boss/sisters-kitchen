import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) arr.push(i);
    if (arr[0] > 1) { arr.unshift('...'); arr.unshift(1); }
    if (arr[arr.length - 1] < pages) { arr.push('...'); arr.push(pages); }
    return arr;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-orange-100 flex items-center justify-center text-brand-muted hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-brand-muted text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
              p === page
                ? 'bg-primary text-white shadow-soft'
                : 'border border-orange-100 text-brand-muted hover:bg-primary hover:text-white hover:border-primary'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className="w-9 h-9 rounded-xl border border-orange-100 flex items-center justify-center text-brand-muted hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
