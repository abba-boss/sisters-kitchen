import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid3X3, List, Trash2, Eye, EyeOff, PenSquare } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/common/EmptyState';
import { postService } from '../../services/postService';
import CreatePostModal from '../../components/social/CreatePostModal';
import { timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function VendorPosts() {
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [view,      setView]      = useState('grid');
  const [filter,    setFilter]    = useState('all');

  useEffect(() => { fetchPosts(); }, [filter]);
  const fetchPosts = () => {
    setLoading(true);
    const p = filter !== 'all' ? { status: filter, limit: 50 } : { limit: 50 };
    postService.getMyPosts(p).then(({ data }) => setPosts(data.data||[])).catch(()=>{}).finally(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    try { await postService.delete(id); setPosts(p=>p.filter(x=>x.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };
  const handleToggle = async (post) => {
    const s = post.status==='published'?'archived':'published';
    try { await postService.update(post.id,{status:s}); setPosts(p=>p.map(x=>x.id===post.id?{...x,status:s}:x)); toast.success(s==='published'?'Published ✅':'Archived'); }
    catch { toast.error('Failed'); }
  };

  const statusColor = { published:'badge-success', draft:'badge-warning', archived:'bg-gray-100 text-gray-500 badge', deleted:'badge-danger' };

  return (
    <DashboardLayout>
      {modal && <CreatePostModal isOpen onClose={()=>setModal(false)} onCreated={(p)=>{setPosts(prev=>[p,...prev]);setModal(false);}} />}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="font-poppins font-bold text-xl text-brand-dark">My Posts</h1><p className="text-brand-muted text-sm">{posts.length} posts</p></div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2 py-2.5 text-sm"><Plus size={15}/>Create Post</button>
      </div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1.5">
          {['all','published','draft','archived'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter===s?'bg-primary text-white shadow-soft':'bg-white text-brand-muted border border-orange-100'}`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-orange-100">
          {[[Grid3X3,'grid'],[List,'list']].map(([Icon,v])=>(
            <button key={v} onClick={()=>setView(v)} className={`p-2 rounded-lg transition-all ${view===v?'bg-primary text-white':'text-brand-muted hover:text-primary'}`}><Icon size={14}/></button>
          ))}
        </div>
      </div>
      {loading ? (
        view==='grid' ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({length:6}).map((_,i)=><div key={i} className="aspect-square skeleton rounded-2xl"/>)}</div>
          : <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-16 rounded-2xl"/>)}</div>
      ) : posts.length===0 ? (
        <EmptyState icon={PenSquare} title="No posts yet" message="Create your first post!" actionLabel="Create Post" onAction={()=>setModal(true)}/>
      ) : view==='grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence>
            {posts.map((post,i)=>{
              const cover=post.media?.[0]?.url;
              return (
                <motion.div key={post.id} layout initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.85}} transition={{delay:i*0.03}}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-brand-bg group cursor-pointer">
                  {cover?<img src={cover} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center p-3"><p className="text-xs text-brand-muted text-center line-clamp-3">{post.caption}</p></div>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-3 text-white text-xs"><span>❤️{post.likesCount}</span><span>💬{post.commentsCount}</span></div>
                    <div className="flex gap-2">
                      <Link to={`/vendor/posts/${post.id}/edit`} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-white text-xs font-semibold">Edit</Link>
                      <button onClick={()=>handleToggle(post)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                        {post.status==='published'?<EyeOff size={13} className="text-white"/>:<Eye size={13} className="text-white"/>}
                      </button>
                      <button onClick={()=>handleDelete(post.id)} className="p-2 bg-red-500/80 rounded-lg hover:bg-red-600/80 transition-all"><Trash2 size={13} className="text-white"/></button>
                    </div>
                  </div>
                  {post.status!=='published'&&<span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor[post.status]}`}>{post.status}</span>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post,i)=>{
            const cover=post.media?.[0]?.url;
            return (
              <motion.div key={post.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}} className="card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                  {cover?<img src={cover} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-sm">📝</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark truncate">{post.caption}</p>
                  <div className="flex items-center gap-3 text-xs text-brand-muted mt-0.5">
                    <span>❤️{post.likesCount}</span><span>💬{post.commentsCount}</span><span>👁{post.viewsCount}</span><span>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`badge ${statusColor[post.status]} capitalize text-xs`}>{post.status}</span>
                  <Link to={`/vendor/posts/${post.id}/edit`} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all"><PenSquare size={14}/></Link>
                  <button onClick={()=>handleToggle(post)} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted transition-all">{post.status==='published'?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                  <button onClick={()=>handleDelete(post.id)} className="p-2 rounded-xl hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
