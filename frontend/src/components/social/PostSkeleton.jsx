export default function PostSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden mb-4 animate-pulse">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 bg-orange-100 rounded-full"/>
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-orange-100 rounded-full w-32"/>
          <div className="h-2.5 bg-orange-50  rounded-full w-20"/>
        </div>
      </div>
      <div className="bg-orange-50" style={{ aspectRatio:'4/3', maxHeight:300 }}/>
      <div className="px-4 py-3 space-y-2">
        <div className="h-3 bg-orange-100 rounded-full w-full"/>
        <div className="h-3 bg-orange-50  rounded-full w-3/4"/>
      </div>
      <div className="px-4 py-3 flex gap-5 border-t border-orange-50">
        <div className="h-4 w-14 bg-orange-100 rounded-full"/>
        <div className="h-4 w-14 bg-orange-100 rounded-full"/>
        <div className="h-4 w-10 bg-orange-100 rounded-full"/>
      </div>
    </div>
  );
}
