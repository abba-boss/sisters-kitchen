import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, Eye, Trash2, ToggleRight, ToggleLeft, Flame } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { productService } from '../../services/productService';
import { formatPrice, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [meta,     setMeta]     = useState({ total:0, pages:1 });
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [input,    setInput]    = useState('');

  useEffect(() => { fetchProducts(); }, [page, search]);

  const fetchProducts = () => {
    setLoading(true);
    productService.getAll({ page, limit:20, search })
      .then(({ data }) => { setProducts(data.data||[]); setMeta(data.meta||{}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => { e.preventDefault(); setSearch(input); setPage(1); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productService.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete product'); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">All Products</h1>
          <p className="text-brand-muted text-sm">{meta.total} total</p>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input type="text" placeholder="Search products…" value={input}
            onChange={e=>setInput(e.target.value)} className="input-field pl-9 py-2 text-sm w-56" />
        </form>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({length:8}).map((_,i)=><div key={i} className="skeleton h-14 rounded-xl"/>)}</div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" message="Adjust your search filters." />
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-bg">
                  <tr className="text-brand-muted text-xs font-semibold uppercase">
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Vendor</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                    <th className="text-right px-4 py-3">Price</th>
                    <th className="text-right px-4 py-3">Stock</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {products.map((p, i) => {
                    const img = p.images?.[0];
                    return (
                      <motion.tr key={p.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                        className="hover:bg-brand-bg/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                              {img ? <img src={img} alt={p.name} className="w-full h-full object-cover"/> : <Package size={14} className="text-brand-muted m-auto mt-2.5"/>}
                            </div>
                            <div>
                              <p className="font-medium text-brand-dark text-sm flex items-center gap-1">
                                {p.name}
                                {p.isFreshToday && <Flame size={12} className="text-primary"/>}
                              </p>
                              {!p.isAvailable && <span className="text-xs text-red-400">Hidden</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-brand-muted hidden md:table-cell text-xs">{p.vendor?.businessName}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="badge bg-orange-50 text-brand-muted text-xs">{p.category?.icon} {p.category?.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-brand-dark text-sm">
                          {formatPrice(p.discountPrice||p.price)}
                          {p.discountPrice && <p className="text-xs text-brand-muted line-through font-normal">{formatPrice(p.price)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right text-brand-muted text-sm">{p.stock}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link to={`/products/${p.id}`} className="p-1.5 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-primary transition-all" title="View">
                              <Eye size={14}/>
                            </Link>
                            <button onClick={()=>handleDelete(p.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all" title="Delete">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={meta.pages} onChange={(p)=>{setPage(p);window.scrollTo(0,0);}} />
        </>
      )}
    </DashboardLayout>
  );
}
