import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { paymentService } from '../../services/paymentService';

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) { setStatus('failed'); return; }

    paymentService.verify(reference)
      .then(({ data }) => {
        setOrderId(data.data?.orderId);
        setStatus('success');
        setTimeout(() => navigate(`/orders/${data.data?.orderId}`), 3000);
      })
      .catch(() => setStatus('failed'));
  }, []);

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-10 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader size={36} className="text-primary animate-spin" />
            </div>
            <h2 className="font-poppins font-bold text-xl text-brand-dark mb-2">Verifying Payment</h2>
            <p className="text-brand-muted text-sm">Please wait while we confirm your payment…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle size={40} className="text-accent" />
            </motion.div>
            <h2 className="font-poppins font-bold text-xl text-brand-dark mb-2">Payment Successful! 🎉</h2>
            <p className="text-brand-muted text-sm mb-6">Your order has been confirmed. Redirecting to your order…</p>
            {orderId && (
              <Link to={`/orders/${orderId}`} className="btn-primary inline-block">
                View Order
              </Link>
            )}
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={40} className="text-red-500" />
            </div>
            <h2 className="font-poppins font-bold text-xl text-brand-dark mb-2">Payment Failed</h2>
            <p className="text-brand-muted text-sm mb-6">We couldn't verify your payment. Please contact support if you were charged.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/orders" className="btn-secondary">My Orders</Link>
              <Link to="/checkout" className="btn-primary">Try Again</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
