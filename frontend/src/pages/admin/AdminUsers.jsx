import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ToggleRight, ToggleLeft, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const roleStyles = {
  admin: 'badge-primary',
  vendor: 'badge-success',
  customer: 'bg-gray-100 text-gray-600 badge',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users', { params: { page, limit: 20, role: roleFilter, search } })
      .then(({ data }) => { setUsers(data.data || []); setMeta(data.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggle = async (id) => {
    setUpdating(id);
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle-status`);
      toast.success(data.message);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
    finally { setUpdating(null); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">Manage Users</h1>
          <p className="text-brand-muted text-sm">{meta.total} users</p>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm w-52"
          />
        </form>
      </div>

      <div className="flex gap-2 mb-5">
        {['', 'customer', 'vendor', 'admin'].map((r) => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              roleFilter === r ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100 hover:border-primary'
            }`}>
            {r || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" message="No users match your current filters." />
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-bg">
                  <tr className="text-brand-muted text-xs font-semibold uppercase">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
                    <th className="text-right px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {users.map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                      className="hover:bg-brand-bg/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-xs">{u.firstName?.[0]}</span>
                          </div>
                          <span className="font-medium text-brand-dark">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${roleStyles[u.role] || 'badge-warning'} capitalize`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-muted text-xs hidden md:table-cell">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleToggle(u.id)} disabled={updating === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ml-auto transition-all disabled:opacity-60 ${
                            u.isActive
                              ? 'bg-accent/10 text-accent hover:bg-accent hover:text-white'
                              : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}>
                          {u.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                          {u.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={meta.pages} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />
        </>
      )}
    </DashboardLayout>
  );
}
