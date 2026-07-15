import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Package, Star, Rss, Heart, Target, ArrowUpRight, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { vendorService } from '../../services/vendorService';
import { postService } from '../../services/postService';
import { formatPrice, getOrderStatusLabel } from '../../utils/formatters';
import api from '../../services/api';

const COLORS = ['#FF7A59','#5FA36A','#F59E0B','#3B82F6','#8B5CF6'];

export default function BusinessHub() {
  const [analytics, setAnalytics] = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [vendor,    setVendor]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');

  useEffect(() => {
    Promise.all([api.get('/analytics/vendor'), vendorService.getMyProfile(), postService.getMyPosts({limit:10})])
      .then(([an,vp,pp]) => { setAnalytics(an.data.data); setVendor(vp.data.data); setPosts(pp.data.data||[]); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const s = analytics?.summary||{};
  const monthly = (analytics?.monthlyRevenue||[]).map(d=>({month:d.month,revenue:Number(d.revenue)||0,orders:Number(d.orders)||0}));
  const daily   = (analytics?.dailyRevenue||[]).map(d=>({day:d.day?.slice(5),revenue:Number(d.revenue)||0}));
  const statusData = (analytics?.ordersByStatus||[]).map(d=>({name:getOrderStatusLabel(d.status),value:Number(d.count)}));
  const topProducts = analytics?.topProducts||[];
  const totalLikes    = posts.reduce((s,p)=>s+(p.likesCount||0),0);
  const totalViews    = posts.reduce((s,p)=>s+(p.viewsCount||0),0);
  const engRate       = totalViews>0?(((totalLikes+posts.reduce((s,p)=>s+(p.commentsCount||0),0))/totalViews)*100).toFixed(1):0;

  const statCards = [
    {label:'Total Earnings',value:s.totalEarnings!==undefined?formatPrice(s.totalEarnings):'—',icon:TrendingUp,color:'bg-accent/10',ic:'text-accent'},
    {label:'Total Products',value:s.totalProducts??'—',icon:Package,color:'bg-blue-50',ic:'text-blue-500'},
    {label:'Rating',value:s.rating?`${Number(s.rating).toFixed(1)} ★`:'—',icon:Star,color:'bg-yellow-50',ic:'text-yellow-500'},
    {label:'Posts',value:posts.length,icon:Rss,color:'bg-primary/10',ic:'text-primary'},
    {label:'Post Likes',value:totalLikes,icon:Heart,color:'bg-red-50',ic:'text-red-400'},
    {label:'Engagement',value:`${engRate}%`,icon:Target,color:'bg-purple-50',ic:'text-purple-500'},
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><h1 className="font-poppins font-bold text-2xl text-brand-dark flex items-center gap-2"><Zap size={22} className="text-primary"/>Business Hub</h1><p className="text-brand-muted text-sm">{vendor?.businessName}</p></div>
        <div className="flex gap-2">
          <Link to="/vendor/posts"   className="btn-secondary py-2 text-sm flex items-center gap-1.5"><Rss size={14}/>Posts</Link>
          <Link to="/vendor/stories" className="btn-primary  py-2 text-sm flex items-center gap-1.5">📸 Stories</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
        {statCards.map(({label,value,icon:Icon,color,ic},i)=>(
          <motion.div key={label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}} className="card p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-2`}><Icon size={17} className={ic}/></div>
            <p className="font-poppins font-bold text-lg text-brand-dark">{loading?'…':value}</p>
            <p className="text-xs text-brand-muted mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card mb-6 w-fit overflow-x-auto scrollbar-hide">
        {['overview','revenue','posts','products'].map(k=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${tab===k?'bg-primary text-white shadow-soft':'text-brand-muted hover:text-brand-dark'}`}>{k}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-poppins font-semibold text-brand-dark mb-4">Monthly Revenue</h3>
            {monthly.length>0?(<ResponsiveContainer width="100%" height={200}><AreaChart data={monthly}><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF7A59" stopOpacity={0.2}/><stop offset="95%" stopColor="#FF7A59" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8"/><XAxis dataKey="month" tick={{fontSize:10,fill:'#8B6361'}}/><YAxis tick={{fontSize:10,fill:'#8B6361'}} tickFormatter={v=>`₦${(v/1000).toFixed(0)}k`}/><Tooltip formatter={v=>formatPrice(v)} contentStyle={{borderRadius:'12px',border:'none'}}/><Area type="monotone" dataKey="revenue" stroke="#FF7A59" strokeWidth={2} fill="url(#rg)"/></AreaChart></ResponsiveContainer>):(<div className="h-48 flex items-center justify-center text-brand-muted text-sm">No data yet</div>)}
          </div>
          <div className="card p-5">
            <h3 className="font-poppins font-semibold text-brand-dark mb-4">Order Status</h3>
            {statusData.length>0?(<ResponsiveContainer width="100%" height={200}><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">{statusData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={{borderRadius:'12px',border:'none'}}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}}/></PieChart></ResponsiveContainer>):(<div className="h-48 flex items-center justify-center text-brand-muted text-sm">No orders yet</div>)}
          </div>
        </div>
      )}

      {tab==='revenue' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-poppins font-semibold text-brand-dark mb-4">Daily Revenue (Last 14 Days)</h3>
            {daily.length>0?(<ResponsiveContainer width="100%" height={240}><BarChart data={daily}><CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8"/><XAxis dataKey="day" tick={{fontSize:10,fill:'#8B6361'}}/><YAxis tick={{fontSize:10,fill:'#8B6361'}} tickFormatter={v=>`₦${(v/1000).toFixed(0)}k`}/><Tooltip formatter={v=>formatPrice(v)} contentStyle={{borderRadius:'12px',border:'none'}}/><Bar dataKey="revenue" fill="#FF7A59" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>):(<div className="h-48 flex items-center justify-center text-brand-muted text-sm">No data yet</div>)}
          </div>
        </div>
      )}

      {tab==='posts' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-50 flex items-center justify-between">
            <h3 className="font-poppins font-semibold text-brand-dark">Posts Performance</h3>
            <Link to="/vendor/posts" className="text-xs text-primary hover:underline">Manage →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-brand-bg"><tr className="text-brand-muted text-xs font-semibold uppercase">
              <th className="text-left px-4 py-3">Post</th><th className="text-right px-4 py-3">Likes</th><th className="text-right px-4 py-3">Comments</th><th className="text-right px-4 py-3">Views</th><th className="text-right px-4 py-3">Eng %</th>
            </tr></thead>
            <tbody className="divide-y divide-orange-50">
              {posts.length===0?<tr><td colSpan={5} className="text-center py-8 text-brand-muted">No posts yet.</td></tr>:posts.map(post=>{
                const cover=post.media?.[0]?.url;
                const eng=post.viewsCount>0?(((post.likesCount+post.commentsCount)/post.viewsCount)*100).toFixed(1):0;
                return (<tr key={post.id} className="hover:bg-brand-bg/30">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-bg flex-shrink-0">{cover?<img src={cover} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-xs">📝</div>}</div><span className="text-brand-dark truncate max-w-[180px] text-xs">{post.caption?.substring(0,50)}…</span></div></td>
                  <td className="px-4 py-3 text-right text-brand-muted">{post.likesCount}</td>
                  <td className="px-4 py-3 text-right text-brand-muted">{post.commentsCount}</td>
                  <td className="px-4 py-3 text-right text-brand-muted">{post.viewsCount}</td>
                  <td className="px-4 py-3 text-right"><span className="text-primary font-semibold text-xs">{eng}%</span></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab==='products' && (
        <div className="card p-5">
          <h3 className="font-poppins font-semibold text-brand-dark mb-5">Top Selling Products</h3>
          {topProducts.length===0?<p className="text-center text-brand-muted text-sm py-8">No sales data yet.</p>:(
            <div className="space-y-4">
              {topProducts.map((p,i)=>(
                <div key={p.productId} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-brand-muted w-5">{i+1}</span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                    {p.images?.split(',')?.[0]?<img src={p.images.split(',')[0]} alt={p.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                    <div className="flex-1 bg-orange-50 rounded-full h-1.5 mt-1 overflow-hidden"><div className="bg-primary h-full rounded-full" style={{width:`${Math.min((p.totalSold/topProducts[0].totalSold)*100,100)}%`}}/></div>
                  </div>
                  <span className="text-sm font-semibold text-accent">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
