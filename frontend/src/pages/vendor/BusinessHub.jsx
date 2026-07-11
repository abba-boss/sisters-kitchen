import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Eye, Heart, MessageCircle,
  ShoppingBag, Star, Rss, Camera, BarChart3,
  ArrowUpRight, Zap, Target, Package
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { vendorService } from '../../services/vendorService';
import { postService } from '../../services/postService';
import { storyService } from '../../services/storyService';
import { formatPrice, formatNumber, getOrderStatusLabel } from '../../utils/formatters';
import api from '../../services/api';

const COLORS = ['#FF7A59','#5FA36A','#F59E0B','#3B82F6','#8B5CF6'];

export default function BusinessHub() {
  const [analytics, setAnalytics] = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [stories,   setStories]   = useState([]);
  const [vendor,    setVendor]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/vendor'),
      vendorService.getMyProfile(),
      postService.getMyPosts({ limit: 10 }),
      storyService.getMyStories(),
    ])
      .then(([an, vp, pp, st]) => {
        setAnalytics(an.data.data);
        setVendor(vp.data.data);
        setPosts(pp.data.data || []);
        setStories(st.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = analytics?.summary || {};
  const monthly = (analytics?.monthlyRevenue || []).map((d) => ({
    month: d.month, revenue: Number(d.revenue)||0, orders: Number(d.orders)||0,
  }));
  const daily = (analytics?.dailyRevenue || []).map((d) => ({
    day: d.day?.slice(5), revenue: Number(d.revenue)||0, orders: Number(d.orders)||0,
  }));
  const statusData = (analytics?.ordersByStatus || []).map((d) => ({
    name: getOrderStatusLabel(d.status), value: Number(d.count),
  }));
  const topProducts = analytics?.topProducts || [];

  // Post engagement totals
  const totalLikes    = posts.reduce((s, p) => s + (p.likesCount||0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.commentsCount||0), 0);
  const totalViews    = posts.reduce((s, p) => s + (p.viewsCount||0), 0);
  const engRate       = totalViews > 0 ? (((totalLikes+totalComments)/totalViews)*100).toFixed(1) : 0;

  const TABS = [
    { key: 'overview',   label: 'Overview'    },
    { key: 'revenue',    label: 'Revenue'      },
    { key: 'posts',      label: 'Post Analytics'},
    { key: 'products',   label: 'Top Products'  },
  ];

  const statCards = [
    { label: 'Total Earnings', value: s.totalEarnings !== undefined ? formatPrice(s.totalEarnings) : '—', icon: TrendingUp, color: 'bg-accent/10', ic: 'text-accent', sub: 'All time' },
    { label: 'Total Products', value: s.totalProducts ?? '—', icon: Package, color: 'bg-blue-50', ic: 'text-blue-500', sub: 'Listed' },
    { label: 'Rating',         value: s.rating ? `${Number(s.rating).toFixed(1)} ★` : '—', icon: Star, color: 'bg-yellow-50', ic: 'text-yellow-500', sub: `${s.totalReviews||0} reviews` },
    { label: 'Posts',          value: posts.length, icon: Rss, color: 'bg-primary/10', ic: 'text-primary', sub: 'Published' },
    { label: 'Post Likes',     value: totalLikes, icon: Heart, color: 'bg-red-50', ic: 'text-red-400', sub: 'Total' },
    { label: 'Engagement',     value: `${engRate}%`, icon: Target, color: 'bg-purple-50', ic: 'text-purple-500', sub: 'Rate' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-brand-dark flex items-center gap-2">
            <Zap size={22} className="text-primary" /> Business Hub
          </h1>
          <p className="text-brand-muted text-sm mt-0.5">{vendor?.businessName} · Full analytics & growth tools</p>
        </div>
        <div className="flex gap-2">
          <Link to="/vendor/posts"    className="btn-secondary py-2 text-sm flex items-center gap-1.5"><Rss size={14} /> Posts</Link>
          <Link to="/vendor/stories"  className="btn-primary  py-2 text-sm flex items-center gap-1.5"><Camera size={14} /> Add Story</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
        {statCards.map(({ label, value, icon: Icon, color, ic, sub }, i) => (
          <motion.div key={label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
            className="card p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon size={17} className={ic} />
            </div>
            <p className="font-poppins font-bold text-lg text-brand-dark leading-none">{loading ? '…' : value}</p>
            <p className="text-xs text-brand-muted mt-0.5">{label}</p>
            <p className="text-xs text-brand-muted/60">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card mb-6 w-fit overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue sparkline */}
          <div className="card p-5">
            <h3 className="font-poppins font-semibold text-brand-dark mb-4">Monthly Revenue</h3>
            {monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="bhRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF7A59" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FF7A59" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8"/>
                  <XAxis dataKey="month" tick={{ fontSize:10, fill:'#8B6361' }}/>
                  <YAxis tick={{ fontSize:10, fill:'#8B6361' }} tickFormatter={(v)=>`₦${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={(v)=>formatPrice(v)} contentStyle={{ borderRadius:'12px', border:'none' }}/>
                  <Area type="monotone" dataKey="revenue" stroke="#FF7A59" strokeWidth={2} fill="url(#bhRev)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>

          {/* Order status pie */}
          <div className="card p-5">
            <h3 className="font-poppins font-semibold text-brand-dark mb-4">Orders by Status</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {statusData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:'12px', border:'none' }}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'11px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>

          {/* Post performance summary */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-poppins font-semibold text-brand-dark">Recent Posts Performance</h3>
              <Link to="/vendor/posts" className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5">
                Manage posts <ArrowUpRight size={12}/>
              </Link>
            </div>
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-muted text-sm">No posts yet.</p>
                <Link to="/vendor/posts" className="btn-primary text-sm mt-3 inline-block">Create your first post</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.slice(0,5).map((post) => {
                  const cover = post.media?.[0]?.url;
                  const eng = post.viewsCount > 0
                    ? (((post.likesCount+post.commentsCount)/post.viewsCount)*100).toFixed(1)
                    : 0;
                  return (
                    <div key={post.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                        {cover ? <img src={cover} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-sm">📝</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-brand-dark truncate">{post.caption}</p>
                        <div className="flex items-center gap-3 text-xs text-brand-muted mt-0.5">
                          <span>❤️ {post.likesCount}</span>
                          <span>💬 {post.commentsCount}</span>
                          <span>👁 {post.viewsCount}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-primary">{eng}%</p>
                        <p className="text-xs text-brand-muted">eng.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Revenue Tab ────────────────────────────────── */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-poppins font-semibold text-brand-dark mb-4">Monthly Revenue & Orders</h3>
            {monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF7A59" stopOpacity={0.2}/><stop offset="95%" stopColor="#FF7A59" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#5FA36A" stopOpacity={0.2}/><stop offset="95%" stopColor="#5FA36A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8"/>
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'#8B6361' }}/>
                  <YAxis yAxisId="r" tick={{ fontSize:11, fill:'#8B6361' }} tickFormatter={(v)=>`₦${(v/1000).toFixed(0)}k`}/>
                  <YAxis yAxisId="o" orientation="right" tick={{ fontSize:11, fill:'#8B6361' }}/>
                  <Tooltip formatter={(v,n)=>n==='revenue'?formatPrice(v):v} contentStyle={{ borderRadius:'12px', border:'none' }}/>
                  <Legend wrapperStyle={{ fontSize:'12px' }}/>
                  <Area yAxisId="r" type="monotone" dataKey="revenue" name="Revenue" stroke="#FF7A59" strokeWidth={2} fill="url(#r1)"/>
                  <Area yAxisId="o" type="monotone" dataKey="orders"  name="Orders"  stroke="#5FA36A" strokeWidth={2} fill="url(#r2)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>

          <div className="card p-5">
            <h3 className="font-poppins font-semibold text-brand-dark mb-4">Daily Revenue (Last 14 Days)</h3>
            {daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8"/>
                  <XAxis dataKey="day" tick={{ fontSize:11, fill:'#8B6361' }}/>
                  <YAxis tick={{ fontSize:11, fill:'#8B6361' }} tickFormatter={(v)=>`₦${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={(v)=>formatPrice(v)} contentStyle={{ borderRadius:'12px', border:'none' }}/>
                  <Bar dataKey="revenue" fill="#FF7A59" radius={[6,6,0,0]} name="Revenue"/>
                </BarChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>
        </div>
      )}

      {/* ── Post Analytics Tab ────────────────────────── */}
      {tab === 'posts' && (
        <div className="space-y-5">
          {/* Engagement summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Likes',    value: totalLikes,    icon: '❤️' },
              { label: 'Total Comments', value: totalComments, icon: '💬' },
              { label: 'Total Views',    value: totalViews,    icon: '👁'  },
              { label: 'Engagement Rate',value: `${engRate}%`, icon: '🎯' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card p-4 text-center">
                <p className="text-2xl mb-1">{icon}</p>
                <p className="font-poppins font-bold text-xl text-brand-dark">{formatNumber ? value : value}</p>
                <p className="text-xs text-brand-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Posts table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-orange-50 flex items-center justify-between">
              <h3 className="font-poppins font-semibold text-brand-dark">All Posts Performance</h3>
              <Link to="/vendor/posts" className="text-xs text-primary hover:underline">Manage →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-bg">
                  <tr className="text-brand-muted text-xs font-semibold uppercase">
                    <th className="text-left px-4 py-3">Post</th>
                    <th className="text-right px-4 py-3">Likes</th>
                    <th className="text-right px-4 py-3">Comments</th>
                    <th className="text-right px-4 py-3">Views</th>
                    <th className="text-right px-4 py-3">Eng. %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {posts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-brand-muted text-sm">No posts yet.</td></tr>
                  ) : posts.map((post) => {
                    const cover = post.media?.[0]?.url;
                    const eng = post.viewsCount > 0
                      ? (((post.likesCount+post.commentsCount)/post.viewsCount)*100).toFixed(1) : 0;
                    return (
                      <tr key={post.id} className="hover:bg-brand-bg/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-bg flex-shrink-0">
                              {cover ? <img src={cover} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">📝</div>}
                            </div>
                            <span className="text-brand-dark truncate max-w-[180px] text-xs">{post.caption?.substring(0,50)}…</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-brand-muted">{post.likesCount}</td>
                        <td className="px-4 py-3 text-right text-brand-muted">{post.commentsCount}</td>
                        <td className="px-4 py-3 text-right text-brand-muted">{post.viewsCount}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-primary font-semibold text-xs">{eng}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Products Tab ──────────────────────────── */}
      {tab === 'products' && (
        <div className="card p-5">
          <h3 className="font-poppins font-semibold text-brand-dark mb-5">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <NoData message="No sales data yet. Products will appear here after you receive orders." />
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-brand-muted w-5 flex-shrink-0">{i+1}</span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                    {p.images?.split(',')?.[0]
                      ? <img src={p.images.split(',')[0]} alt={p.name} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex-1 bg-orange-50 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.min((p.totalSold/topProducts[0].totalSold)*100, 100)}%` }}/>
                      </div>
                      <span className="text-xs text-brand-muted flex-shrink-0">{p.totalSold} sold</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-accent flex-shrink-0">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function NoData({ message = "No data yet — keep selling!" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 size={32} className="text-orange-100 mb-2" />
      <p className="text-brand-muted text-sm">{message}</p>
    </div>
  );
}
