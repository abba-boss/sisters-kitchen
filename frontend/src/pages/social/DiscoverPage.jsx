import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Flame, Star, TrendingUp, ChevronRight, Sparkles, Grid3X3, Compass } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import FollowButton from '../../components/social/FollowButton';
import { productService } from '../../services/productService';
import { vendorService } from '../../services/vendorService';
import { categoryService } from '../../services/categoryService';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../utils/formatters';

const COLLECTIONS = [
  { id:'healthy',   label:'Healthy & Fresh',  emoji:'🥗', color:'bg-green-50  text-green-600',  query:'healthy'  },
  { id:'desserts',  label:'Sweet Treats',      emoji:'🍰', color:'bg-pink-50   text-pink-500',   query:'cake'     },
  { id:'breakfast', label:'Breakfast Picks',   emoji:'🍳', color:'bg-yellow-50 text-yellow-600', query:'breakfast'},
  { id:'dinner',    label:'Dinner Specials',   emoji:'🍽️', color:'bg-orange-50 text-orange-500', query:'dinner'   },
  { id:'drinks',    label:'Cold Drinks',       emoji:'🥤', color:'bg-blue-50   text-blue-500',   query:'smoothie' },
  { id:'grills',    label:'Grills & BBQ',      emoji:'🍖', color:'bg-red-50    text-red-500',    query:'suya'     },
];

const TRENDING_SEARCHES = ['Jollof Rice','Shawarma','Burger','Pizza','Cake','Suya','Smoothie','Doughnuts','Pasta','Puff Puff'];

export default function DiscoverPage() {
  const [q,           setQ]           = useState('');
  const [categories,  setCategories]  = useState([]);
  const [trendProd,   setTrendProd]   = useState([]);
  const [topVendors,  setTopVendors]  = useState([]);
  const [featured,    setFeatured]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      categoryService.getAll(),
      productService.getAll({ sort:'popular', limit:8 }),
      vendorService.getAll({ limit:6 }),
      productService.getFeatured(),
    ]).then(([c,p,v,f]) => {
      setCategories(c.data.data||[]);
      setTrendProd(p.data.data||[]);
      setTopVendors(v.data.data||[]);
      setFeatured(f.data.data||[]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const handleSearch = (e) => { e.preventDefault(); if (q.trim()) navigate(`/products?search=${encodeURIComponent(q.trim())}`); };

  return (
    <MainLayout>
      <div className="page-container py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-poppins font-bold text-2xl text-brand-dark flex items-center gap-2">
            <Compass size={24} className="text-primary"/> Discover
          </h1>
          <p className="text-brand-muted text-sm mt-0.5">Explore food, vendors, and collections</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted"/>
          <input type="text" value={q} onChange={(e)=>setQ(e.target.value)}
            placeholder="Search food, vendors, categories…"
            className="input-field pl-11 pr-4 h-12 shadow-card text-base"/>
          {q && <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-xl">Go</button>}
        </form>

        {/* Trending searches */}
        <div className="mb-8">
          <h2 className="font-poppins font-semibold text-brand-dark mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary"/> Trending Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((s)=>(
              <motion.button key={s} whileTap={{scale:0.93}}
                onClick={()=>navigate(`/products?search=${encodeURIComponent(s)}`)}
                className="text-sm font-medium px-4 py-2 bg-white rounded-full border border-orange-100 text-brand-dark hover:bg-primary hover:text-white hover:border-primary transition-all shadow-card">
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="mb-8">
          <h2 className="font-poppins font-semibold text-brand-dark mb-3 flex items-center gap-2">
            <Grid3X3 size={16} className="text-primary"/> Collections
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {COLLECTIONS.map((col,i)=>(
              <motion.button key={col.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                whileHover={{y:-3}} whileTap={{scale:0.96}}
                onClick={()=>navigate(`/products?search=${col.query}`)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${col.color} border border-current/10 hover:shadow-card transition-all`}>
                <span className="text-3xl">{col.emoji}</span>
                <span className="text-xs font-semibold text-center leading-tight">{col.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Browse Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-poppins font-semibold text-brand-dark flex items-center gap-2">
              <Sparkles size={16} className="text-primary"/> Browse Categories
            </h2>
            <Link to="/products" className="text-primary text-sm font-semibold hover:underline">All</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {(loading ? Array.from({length:6}) : categories.slice(0,12)).map((cat,i)=>(
              loading ? (
                <div key={i} className="skeleton rounded-2xl h-20"/>
              ) : (
                <motion.button key={cat.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}}
                  whileTap={{scale:0.94}}
                  onClick={()=>navigate(`/products?category=${cat.id}`)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-orange-100 hover:border-primary hover:bg-primary/5 transition-all shadow-card">
                  <span className="text-2xl">{cat.icon||'🍽️'}</span>
                  <span className="text-xs font-semibold text-brand-dark text-center truncate w-full">{cat.name.split(' ')[0]}</span>
                </motion.button>
              )
            ))}
          </div>
        </div>

        {/* Trending Products */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-poppins font-semibold text-brand-dark flex items-center gap-2">
              <Flame size={16} className="text-primary"/> Trending Dishes
            </h2>
            <Link to="/products?sort=popular" className="text-primary text-sm font-semibold hover:underline flex items-center gap-0.5">
              See all <ChevronRight size={13}/>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(loading ? Array.from({length:8}) : trendProd.slice(0,8)).map((p,i)=>(
              loading ? (
                <div key={i} className="skeleton rounded-2xl h-48"/>
              ) : (
                <motion.div key={p.id} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.05}}
                  whileHover={{y:-3}} className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer group"
                  onClick={()=>navigate(`/products/${p.id}`)}>
                  <div className="relative h-32 overflow-hidden">
                    <img src={p.images?.[0]||'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300'} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
                      onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300';}}/>
                    {i < 3 && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        #{i+1}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-primary font-medium truncate">{p.vendor?.businessName}</p>
                    <h3 className="text-sm font-semibold text-brand-dark line-clamp-1 mt-0.5">{p.name}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-poppins font-bold text-sm text-brand-dark">{formatPrice(Number(p.discountPrice)||Number(p.price))}</span>
                      <span className="flex items-center gap-1 text-xs text-brand-muted">
                        <Star size={10} fill="#FF7A59" className="text-primary"/>{Number(p.rating||0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        </div>

        {/* Featured Vendors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-poppins font-semibold text-brand-dark flex items-center gap-2">
              <Star size={16} className="text-yellow-500"/> Featured Vendors
            </h2>
            <Link to="/vendors" className="text-primary text-sm font-semibold hover:underline flex items-center gap-0.5">
              All vendors <ChevronRight size={13}/>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(loading ? Array.from({length:6}) : topVendors).map((v,i)=>(
              loading ? (
                <div key={i} className="skeleton rounded-2xl h-28"/>
              ) : (
                <motion.div key={v.id} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.06}}
                  className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
                  <Link to={`/vendors/${v.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 flex-shrink-0">
                      {v.logo ? <img src={v.logo} alt={v.businessName} className="w-full h-full object-cover"/> :
                        <div className="w-full h-full flex items-center justify-center"><span className="font-bold text-primary text-lg">{v.businessName?.[0]}</span></div>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-dark text-sm truncate">{v.businessName}</p>
                      <div className="flex items-center gap-2 text-xs text-brand-muted mt-0.5">
                        <span className="flex items-center gap-0.5"><Star size={9} fill="#FF7A59" className="text-primary"/>{Number(v.rating||0).toFixed(1)}</span>
                        <span>{v.isOpen ? <span className="text-accent font-medium">● Open</span> : '○ Closed'}</span>
                      </div>
                    </div>
                  </Link>
                  {isAuthenticated && <FollowButton vendorId={v.id} size="sm" variant="fill"/>}
                </motion.div>
              )
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
