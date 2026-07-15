import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Clock, CheckCircle, Store, X, SlidersHorizontal, Filter } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import FollowButton from '../../components/social/FollowButton';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { vendorService } from '../../services/vendorService';
import { useAuthStore } from '../../store/authStore';
import { VendorSkeleton } from '../../components/common/LoadingSkeleton';

export default function VendorsPage() {
  const [vendors,  setVendors]  = useState([]);
  const [meta,     setMeta]     = useState({ total:0, pages:1 });
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [input,    setInput]    = useState('');
  const [search,   setSearch]   = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const debounce = useRef(null);

  useEffect(() => {
    setLoading(true);
    vendorService.getAll({ page, limit: 12, search })
      .then(({ data }) => { setVendors(data.data||[]); setMeta(data.meta||{}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  const handleInput = (val) => {
    setInput(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setSearch(val); setPage(1); }, 380);
  };

  const displayed = openOnly ? vendors.filter((v) => v.isOpen) : vendors;

  return (
    <MainLayout>
      <div className="page-container py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="section-title mb-1">Our Vendors</h1>
          <p className="text-brand-muted text-sm">Discover talented female food entrepreneurs</p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted"/>
            <input type="text" placeholder="Search vendors by name…" value={input} onChange={(e)=>handleInput(e.target.value)}
              className="input-field pl-11 h-11"/>
            {input && <button onClick={()=>{setInput('');setSearch('');}} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-red-500"><X size={15}/></button>}
          </div>
          <button onClick={()=>setOpenOnly(!openOnly)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
              openOnly ? 'bg-accent text-white border-accent' : 'bg-white text-brand-muted border-orange-100 hover:border-accent hover:text-accent'
            }`}>
            <span className={`w-2 h-2 rounded-full ${openOnly?'bg-white':'bg-accent'}`}/>
            Open Now
          </button>
        </div>

        {/* Stats */}
        <p className="text-brand-muted text-sm mb-5">
          {openOnly ? `${displayed.length} vendors open` : `${meta.total} vendors found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({length:9}).map((_,i)=><VendorSkeleton key={i}/>)}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState icon={Store} title={openOnly?'No vendors open right now':'No vendors found'}
            message={openOnly?'Try removing the "Open Now" filter.':'Try a different search.'}
            actionLabel={openOnly?'Show All':undefined} onAction={openOnly?()=>setOpenOnly(false):undefined} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayed.map((vendor, i) => (
              <motion.div key={vendor.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
                {/* Cover */}
                <div className="relative h-36 overflow-hidden cursor-pointer" onClick={()=>navigate(`/vendors/${vendor.id}`)}>
                  <img src={vendor.coverImage||'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'} alt={vendor.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';}}/>
                  <div className="absolute inset-0 bg-card-gradient"/>
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${vendor.isOpen?'bg-accent text-white':'bg-white/80 text-brand-muted'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${vendor.isOpen?'bg-white animate-pulse':'bg-brand-muted'}`}/>
                    {vendor.isOpen?'Open':'Closed'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 -mt-8 relative">
                  <div className="flex items-end gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-card overflow-hidden bg-brand-bg flex-shrink-0 cursor-pointer"
                      onClick={()=>navigate(`/vendors/${vendor.id}`)}>
                      {vendor.logo ? <img src={vendor.logo} alt={vendor.businessName} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><span className="font-bold text-primary text-xl">{vendor.businessName?.[0]}</span></div>}
                    </div>
                    <div className="pb-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-poppins font-semibold text-brand-dark text-sm truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={()=>navigate(`/vendors/${vendor.id}`)}>
                          {vendor.businessName}
                        </h3>
                        {vendor.status==='approved' && <CheckCircle size={13} className="text-accent flex-shrink-0"/>}
                      </div>
                    </div>
                  </div>

                  {vendor.description && <p className="text-xs text-brand-muted line-clamp-2 mb-3">{vendor.description}</p>}

                  <div className="flex items-center justify-between text-xs text-brand-muted mb-3">
                    <div className="flex items-center gap-1"><Star size={11} fill="#FF7A59" className="text-primary"/>
                      <span className="font-semibold text-brand-dark">{Number(vendor.rating||0).toFixed(1)}</span>
                      <span>({vendor.totalReviews})</span>
                    </div>
                    {vendor.address && <div className="flex items-center gap-1"><MapPin size={11}/><span className="truncate max-w-[100px]">{vendor.address}</span></div>}
                  </div>

                  {vendor.openingTime && (
                    <div className="flex items-center gap-1 text-xs text-brand-muted mb-3">
                      <Clock size={11} className="text-primary"/>{vendor.openingTime}–{vendor.closingTime}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button onClick={()=>navigate(`/vendors/${vendor.id}`)}
                      className="flex-1 text-center text-xs font-semibold text-brand-dark border border-orange-100 py-2 rounded-xl hover:bg-brand-bg transition-all">
                      View Store
                    </button>
                    {isAuthenticated && <FollowButton vendorId={vendor.id} size="sm" variant="fill"/>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Pagination page={page} pages={meta.pages} onChange={(p)=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'});}}/>
      </div>
    </MainLayout>
  );
}
