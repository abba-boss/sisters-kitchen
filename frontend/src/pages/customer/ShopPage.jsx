import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, ChevronDown, Flame, Star, Clock, Plus, Heart,
  ShoppingCart, Zap, Timer, Gift, ChevronRight, ArrowRight,
  Sparkles, TrendingUp, Package
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import StoriesBar from '../../components/social/StoriesBar';
import FollowButton from '../../components/social/FollowButton';
import { productService } from '../../services/productService';
import { vendorService } from '../../services/vendorService';
import { categoryService } from '../../services/categoryService';
import { statsService } from '../../services/statsService';
import { useCart } from '../../hooks/useCart';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useRewardStore } from '../../store/rewardStore';
import { formatPrice, timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening'];
const QUICK_TAGS = ['Jollof Rice','Shawarma','Burger','Pizza','Cake','Suya','Smoothie','Doughnuts'];
const LOCATION   = 'Lagos, Nigeria';

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? GREETINGS[0] : h < 17 ? GREETINGS[1] : GREETINGS[2];
}

// Countdown timer
function Countdown({ endsAt }) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = endsAt - Date.now();
      if (d <= 0) { setLeft('00:00:00'); return; }
      const h = String(Math.floor(d/3600000)).padStart(2,'0');
      const m = String(Math.floor((d%3600000)/60000)).padStart(2,'0');
      const s = String(Math.floor((d%60000)/1000)).padStart(2,'0');
      setLeft(`${h}:${m}:${s}`);
    };
    tick(); const id = setInterval(tick,1000); return () => clearInterval(id);
  }, [endsAt]);
  return <span className="font-mono">{left}</span>;
}

// Skeleton for product card
function ProductSkel() {
  return (
    <div className="flex-shrink-0 w-48 sm:w-56 rounded-3xl overflow-hidden shadow-card animate-pulse">
      <div className="h-40 bg-orange-100" />
      <div className="p-3 space-y-2 bg-white">
        <div className="h-3 bg-orange-100 rounded-full w-2/3" />
        <div className="h-3 bg-orange-50 rounded-full w-4/5" />
        <div className="flex justify-between items-center">
          <div className="h-4 bg-orange-100 rounded-full w-1/3" />
          <div className="w-8 h-8 bg-orange-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Single product card for horizontal scrolls
function ProductCard({ product, index = 0, badge }) {
  const { addToCart }  = useCart();
  const { toggle, isWishlisted } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);
  const navigate = useNavigate();
  const price    = Number(product.discountPrice) || Number(product.price);
  const pctOff   = product.discountPrice
    ? Math.round(((Number(product.price)-Number(product.discountPrice))/Number(product.price))*100) : 0;
  const wishlisted = isWishlisted(product.id);

  return (
    <motion.div
      initial={{ opacity:0, x:20 }}
      animate={{ opacity:1, x:0 }}
      transition={{ delay: index*0.05 }}
      whileHover={{ y:-3 }}
      className="flex-shrink-0 w-48 sm:w-56 rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 bg-white overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div className="relative h-40 overflow-hidden bg-orange-50">
        <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'}
          alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
          onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400';}} />
        {badge && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
            {badge}
          </span>
        )}
        {pctOff > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">-{pctOff}%</span>}
        {product.isFreshToday && !badge && (
          <span className="absolute top-2 left-2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Flame size={9}/> Fresh
          </span>
        )}
        <button onClick={(e)=>{e.stopPropagation();if(!isAuthenticated){openAuth('Sign in to save');return;}toggle(product);toast.success(wishlisted?'Removed':'Saved ❤️',{id:`wl-${product.id}`});}}
          className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow transition-all ${wishlisted?'bg-primary text-white':'bg-white/90 text-brand-muted hover:bg-primary hover:text-white'}`}>
          <Heart size={13} fill={wishlisted?'currentColor':'none'} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-primary font-semibold truncate mb-0.5">{product.vendor?.businessName}</p>
        <h3 className="text-sm font-semibold text-brand-dark line-clamp-1 mb-1.5">{product.name}</h3>
        <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-2">
          <Star size={10} fill="#FF7A59" className="text-primary" />
          <span className="font-semibold text-brand-dark">{Number(product.rating||0).toFixed(1)}</span>
          {product.preparationTime && <><span>·</span><Clock size={10}/><span>{product.preparationTime}</span></>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-poppins font-bold text-brand-dark text-sm">{formatPrice(price)}</span>
            {product.discountPrice && <span className="text-xs text-brand-muted line-through ml-1">{formatPrice(product.price)}</span>}
          </div>
          <motion.button whileTap={{scale:0.85}}
            onClick={(e)=>{e.stopPropagation();addToCart(product);}}
            className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors shadow-soft">
            <Plus size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Horizontal scroll row with title
function ScrollRow({ title, subtitle, linkTo, products, loading, badge, countdown }) {
  const scrollRef = useRef(null);
  return (
    <section className="py-6">
      <div className="page-container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-poppins font-bold text-lg text-brand-dark flex items-center gap-2">
              {title}
              {countdown && (
                <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Timer size={10}/><Countdown endsAt={countdown}/>
                </span>
              )}
            </h2>
            {subtitle && <p className="text-xs text-brand-muted">{subtitle}</p>}
          </div>
          {linkTo && (
            <Link to={linkTo} className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:underline">
              See all <ChevronRight size={14}/>
            </Link>
          )}
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {loading
            ? Array.from({length:5}).map((_,i)=><ProductSkel key={i}/>)
            : products.map((p,i) => <ProductCard key={p.id} product={p} index={i} badge={badge?.(p,i)} />)
          }
        </div>
      </div>
    </section>
  );
}

export default function ShopPage() {
  const navigate  = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const balance   = useRewardStore((s) => s.balance);

  const [query,       setQuery]       = useState('');
  const [focused,     setFocused]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [trending,    setTrending]    = useState([]);
  const [fresh,       setFresh]       = useState([]);
  const [featured,    setFeatured]    = useState([]);
  const [vendors,     setVendors]     = useState([]);
  const [loading,     setLoading]     = useState({ trending:true, fresh:true, featured:true, vendors:true });
  const inputRef = useRef(null);
  const tonight  = new Date(); tonight.setHours(23,59,59,0);

  useEffect(() => {
    // Keyboard shortcut
    const h = (e) => { if (e.key==='/' && document.activeElement!==inputRef.current) { e.preventDefault(); inputRef.current?.focus(); } };
    document.addEventListener('keydown',h); return () => document.removeEventListener('keydown',h);
  }, []);

  useEffect(() => {
    categoryService.getAll().then(({data})=>setCategories(data.data||[])).catch(()=>{});
    statsService.getPublic().then(({data})=>setStats(data.data)).catch(()=>{});
    productService.getAll({sort:'popular',limit:10}).then(({data})=>{setTrending(data.data||[]);setLoading(p=>({...p,trending:false}));}).catch(()=>setLoading(p=>({...p,trending:false})));
    productService.getFreshToday().then(({data})=>{setFresh(data.data||[]);setLoading(p=>({...p,fresh:false}));}).catch(()=>setLoading(p=>({...p,fresh:false})));
    productService.getFeatured().then(({data})=>{setFeatured(data.data||[]);setLoading(p=>({...p,featured:false}));}).catch(()=>setLoading(p=>({...p,featured:false})));
    vendorService.getAll({limit:8}).then(({data})=>{setVendors(data.data||[]);setLoading(p=>({...p,vendors:false}));}).catch(()=>setLoading(p=>({...p,vendors:false})));
  }, []);

  // Live suggestions
  useEffect(() => {
    if (!query.trim()||query.length<2){setSuggestions([]);return;}
    const t = setTimeout(()=>{
      productService.getAll({search:query,limit:5}).then(({data})=>setSuggestions(data.data||[])).catch(()=>{});
    },280);
    return ()=>clearTimeout(t);
  }, [query]);

  const handleSearch = (e) => { e?.preventDefault(); if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`); setFocused(false); };

  const trendingBadge = (_,i) => {
    if (i===0) return <><Star size={9}/> Best Seller</>;
    if (i===1) return <><Flame size={9}/> Popular</>;
    if (i===2) return <><Zap size={9}/> Hot</>;
    return null;
  };

  return (
    <MainLayout>
      {/* ── Hero search ──────────────────────────────────── */}
      <section className="bg-[#FFF6EE] pb-0">
        <div className="page-container pt-6 pb-5">
          {/* Location + greeting */}
          <div className="flex items-center gap-1.5 text-sm text-brand-muted mb-3">
            <MapPin size={14} className="text-primary" />
            <span className="font-medium">{LOCATION}</span>
            <ChevronDown size={12} />
          </div>
          <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-brand-dark mb-1">
            {getGreeting()}, {user?.firstName || 'Friend'} 👋
          </h1>
          <p className="text-brand-muted text-sm mb-5">What are you craving today?</p>

          {/* Search */}
          <div className="relative max-w-2xl">
            <div className={`flex items-center bg-white rounded-2xl shadow-card transition-all ${focused?'ring-2 ring-primary/40 shadow-soft':''}`}>
              <Search size={18} className="ml-4 text-brand-muted flex-shrink-0" />
              <input ref={inputRef} type="text" value={query}
                onChange={(e)=>setQuery(e.target.value)}
                onFocus={()=>setFocused(true)}
                onBlur={()=>setTimeout(()=>setFocused(false),180)}
                placeholder="Search food, vendors, dishes…"
                className="flex-1 bg-transparent px-3 py-4 text-sm focus:outline-none placeholder-brand-muted text-brand-dark"
              />
              <motion.button whileTap={{scale:0.9}} onClick={handleSearch}
                className="m-1.5 bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary-dark transition-colors">
                <Search size={16} />
              </motion.button>
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {focused && (query.length>=2 ? suggestions.length>0 : true) && (
                <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card-hover border border-orange-50 z-30 overflow-hidden">
                  {!query && (
                    <div className="p-3">
                      <p className="text-xs font-semibold text-brand-muted mb-2">Trending</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_TAGS.map((s)=>(
                          <button key={s} onMouseDown={()=>{navigate(`/products?search=${encodeURIComponent(s)}`);}}
                            className="text-xs font-medium px-3 py-1.5 bg-brand-bg rounded-full text-brand-muted hover:bg-primary hover:text-white transition-all">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {suggestions.map((p)=>(
                    <button key={p.id} onMouseDown={()=>navigate(`/products/${p.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-bg text-left">
                      <img src={p.images?.[0]||'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=60'}
                        alt={p.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                        onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=60';}} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                        <p className="text-xs text-brand-muted">{p.vendor?.businessName}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatPrice(Number(p.discountPrice)||Number(p.price))}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats chips */}
          {stats && (
            <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide">
              {[
                {icon:'🏪', v:`${stats.vendors}+ Vendors`},
                {icon:'🍽️', v:`${stats.products}+ Dishes`},
                {icon:'⭐', v:`${stats.avgRating} Rating`},
              ].map(({icon,v})=>(
                <span key={v} className="flex-shrink-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-brand-dark shadow-card">
                  {icon} {v}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Stories ─────────────────────────────────── */}
        <StoriesBar />
      </section>

      {/* ── Categories ──────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-5 bg-white border-b border-orange-50">
          <div className="page-container">
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5">
              <button onClick={()=>navigate('/products')}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary text-white text-xs font-semibold shadow-soft min-w-[64px]">
                <span className="text-xl">🍽️</span>All
              </button>
              {categories.map((c)=>(
                <button key={c.id} onClick={()=>navigate(`/products?category=${c.id}`)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-bg border border-orange-100 hover:border-primary hover:bg-primary/5 text-xs font-semibold text-brand-dark transition-all min-w-[64px]">
                  <span className="text-xl">{c.icon||'🍽️'}</span>
                  <span className="leading-tight text-center max-w-[56px] truncate">{c.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trending Today ──────────────────────────────── */}
      <div className="bg-white">
        <ScrollRow title={<><TrendingUp size={18} className="text-primary"/> Trending Today</>}
          subtitle="Most ordered this week"
          linkTo="/products?sort=popular"
          products={trending}
          loading={loading.trending}
          badge={trendingBadge}
        />
      </div>

      {/* ── Fresh Today ─────────────────────────────────── */}
      <div className="bg-[#FFF6EE]">
        <ScrollRow title={<><Flame size={18} className="text-primary"/> Today's Freshly Made</>}
          subtitle="Made fresh — available until tonight"
          linkTo="/products?isFreshToday=true"
          products={fresh}
          loading={loading.fresh}
          countdown={tonight.getTime()}
        />
      </div>

      {/* ── Featured / Recommended ──────────────────────── */}
      <div className="bg-white">
        <ScrollRow title={<><Sparkles size={18} className="text-primary"/> Recommended for You</>}
          subtitle="Handpicked by our team"
          linkTo="/products?isFeatured=true"
          products={featured}
          loading={loading.featured}
        />
      </div>

      {/* ── Top Vendors ─────────────────────────────────── */}
      <section className="py-6 bg-[#FFF6EE]">
        <div className="page-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-poppins font-bold text-lg text-brand-dark flex items-center gap-2">
                <Star size={18} className="text-yellow-500"/> Top Rated Vendors
              </h2>
              <p className="text-xs text-brand-muted">Trusted female food entrepreneurs</p>
            </div>
            <Link to="/vendors" className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:underline">
              See all <ChevronRight size={14}/>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {loading.vendors
              ? Array.from({length:5}).map((_,i)=><div key={i} className="flex-shrink-0 w-36 h-52 skeleton rounded-3xl"/>)
              : vendors.map((v,i)=>(
                <motion.div key={v.id} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                  className="flex-shrink-0 w-36 bg-white rounded-3xl shadow-card overflow-hidden">
                  <Link to={`/vendors/${v.id}`}>
                    <div className="relative h-20 overflow-hidden">
                      <img src={v.coverImage||'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300'}
                        alt={v.businessName} className="w-full h-full object-cover"
                        onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300';}} />
                      <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white ${v.isOpen?'bg-accent':'bg-gray-400'}`}/>
                    </div>
                    <div className="p-3 -mt-5 relative">
                      <div className="w-10 h-10 rounded-2xl border-2 border-white shadow-card overflow-hidden bg-brand-bg mx-auto mb-2">
                        {v.logo ? <img src={v.logo} alt={v.businessName} className="w-full h-full object-cover"/> : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">{v.businessName?.[0]}</span>
                          </div>
                        )}
                      </div>
                      <p className="font-semibold text-brand-dark text-xs text-center truncate mb-0.5">{v.businessName}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-brand-muted mb-2">
                        <Star size={9} fill="#FF7A59" className="text-primary"/>
                        <span className="font-semibold text-brand-dark">{Number(v.rating||0).toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                  {isAuthenticated && (
                    <div className="px-2 pb-3">
                      <FollowButton vendorId={v.id} size="sm" variant="fill" className="w-full justify-center" />
                    </div>
                  )}
                </motion.div>
              ))
            }
          </div>
        </div>
      </section>

      {/* ── Rewards Banner ──────────────────────────────── */}
      <section className="py-5 bg-white">
        <div className="page-container">
          <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-orange-500 to-yellow-400 p-5 sm:p-7">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full"/>
            <div className="absolute -bottom-8 -left-8  w-28 h-28 bg-white/10 rounded-full"/>
            <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-poppins font-bold text-white text-xl mb-1">🪙 Kitchen Coins</h3>
                <p className="text-white/80 text-sm max-w-xs">
                  {isAuthenticated && balance > 0
                    ? `You have ${Math.floor(balance)} coins — worth ₦${Math.floor(balance/10)*100} off!`
                    : 'Earn coins with every order, review & daily login!'}
                </p>
              </div>
              <motion.button whileTap={{scale:0.95}}
                onClick={()=>navigate(isAuthenticated?'/rewards':'/register')}
                className="flex items-center gap-2 bg-white text-primary font-bold px-5 py-2.5 rounded-2xl shadow-soft text-sm hover:bg-orange-50 transition-all">
                <Gift size={15}/> {isAuthenticated ? 'View Wallet' : 'Get Started'}
                <ArrowRight size={14}/>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
