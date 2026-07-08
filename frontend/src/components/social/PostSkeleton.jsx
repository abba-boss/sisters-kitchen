export default function PostSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] shadow-card border border-orange-100 overflow-hidden mb-5 animate-pulse">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-11 h-11 bg-orange-100 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-orange-100 rounded-full w-36" />
          <div className="h-2.5 bg-orange-50 rounded-full w-24" />
        </div>
      </div>
      <div className="mx-4 rounded-[1.5rem] bg-orange-50" style={{ aspectRatio: '4/3', maxHeight: 420 }} />
      <div className="px-4 py-4 space-y-2">
        <div className="h-12 bg-orange-50 rounded-3xl w-full" />
        <div className="h-3 bg-orange-100 rounded-full w-full" />
        <div className="h-3 bg-orange-50 rounded-full w-3/4" />
      </div>
      <div className="px-4 py-3 flex gap-5 border-t border-orange-50">
        <div className="h-5 w-16 bg-orange-100 rounded-full" />
        <div className="h-5 w-16 bg-orange-100 rounded-full" />
        <div className="h-5 w-10 bg-orange-100 rounded-full" />
      </div>
    </div>
  );
}
