import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Store, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { vendorService } from '../../services/vendorService';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const statusStyles = {
  pending: 'badge-warning',
  approved: 'badge-success',
  suspended: 'badge-danger',
};

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(null);

  const fetchVendors = () => {
    setLoading(true);
    api.get('/admin/vendors', { params: { status: statusFilter, page, limit: 20 } })
      .then(({ data }) => { setVendors(data.data || []); setMeta(data.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVendors(); }, [statusFilter, page]);

  const handleApproval = async (id, status) => {
    setUpdating(id);
    try {
      await vendorService.updateApproval(id, status);
      toast.success(`Vendor ${status}`);
      fetchVendors();
    } catch { toast.error('Failed to update vendor'); }
    finally { setUpdating(null); }
  };

  const filtered = search
    ? vendors.filter((v) =>
        v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
        v.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : vendors;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">Manage Vendors</h1>
          <p className="text-brand-muted text-sm">{meta.total} vendors</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm w-52"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['', 'pending', 'approved', 'suspended'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              statusFilter === s ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100 hover:border-primary'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-bg">
                  <tr className="text-brand-muted text-xs font-semibold uppercase">
                    <th className="text-left px-4 py-3">Vendor</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Owner</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Rating</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Joined</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {filtered.map((v, i) => (
                    <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-brand-bg/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            {v.logo ? (
                              <img src={v.logo} alt={v.businessName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span className="font-bold text-primary text-sm">{v.businessName?.[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-brand-dark">{v.businessName}</p>
                            {v.address && <p className="text-xs text-brand-muted">{v.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-brand-dark text-sm">{v.user?.firstName} {v.user?.lastName}</p>
                        <p className="text-xs text-brand-muted">{v.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-yellow-500 font-medium text-sm">
                        {Number(v.rating || 0).toFixed(1)} ★
                        <p className="text-xs text-brand-muted font-normal">{v.totalReviews} reviews</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statusStyles[v.status] || 'badge-warning'} capitalize`}>{v.status}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-muted text-xs hidden lg:table-cell">{formatDate(v.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/vendors/${v.id}`} className="p-1.5 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-primary transition-all" title="View store">
                            <Eye size={14} />
                          </Link>
                          {v.status !== 'approved' && (
                            <button onClick={() => handleApproval(v.id, 'approved')} disabled={updating === v.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-semibold hover:bg-accent hover:text-white transition-all">
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          {v.status !== 'suspended' && (
                            <button onClick={() => handleApproval(v.id, 'suspended')} disabled={updating === v.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all">
                              <XCircle size={12} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <p className="text-center text-brand-muted text-sm py-10">No vendors found.</p>}
          </div>
          <Pagination page={page} pages={meta.pages} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />
        </>
      )}
    </DashboardLayout>
  );
}
