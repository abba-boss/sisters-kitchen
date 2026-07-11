import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Receipt, ChevronRight } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { paymentService } from '../../services/paymentService';
import { formatPrice, formatDateTime } from '../../utils/formatters';

const statusStyles = {
  success: 'badge-success',
  pending: 'badge-warning',
  failed: 'badge-danger',
  refunded: 'bg-blue-100 text-blue-600 badge',
};

const methodLabel = {
  paystack: 'Paystack',
  cash_on_delivery: 'Cash on Delivery',
  bank_transfer: 'Bank Transfer',
};

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    paymentService.getMyPayments({ page, limit: 10 })
      .then(({ data }) => { setPayments(data.data || []); setMeta(data.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <MainLayout>
      <div className="page-container page-shell">
        <h1 className="section-title mb-8">Payment History</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-5 skeleton h-20" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" message="Your payment history will appear here after your first order." actionLabel="Browse Food" actionTo="/products" />
        ) : (
          <div className="space-y-3">
            {payments.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <CreditCard size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{p.reference}</p>
                    <p className="text-xs text-brand-muted">{methodLabel[p.method] || p.method} · {formatDateTime(p.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-poppins font-bold text-brand-dark">{formatPrice(p.amount)}</p>
                    <span className={`badge ${statusStyles[p.status] || 'badge-warning'} capitalize`}>{p.status}</span>
                  </div>
                  {p.status === 'success' && (
                    <Link to={`/orders/${p.order?.id}`} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all">
                      <Receipt size={16} />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
            <Pagination page={page} pages={meta.pages} onChange={setPage} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
