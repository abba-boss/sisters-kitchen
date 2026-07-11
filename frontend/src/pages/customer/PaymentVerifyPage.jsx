import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { useCartStore } from '../../store/cartStore';
import { consumePendingCheckout } from '../../utils/checkoutStorage';

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);
  const clearVendorItems = useCartStore((s) => s.clearVendorItems);
  const [status, setStatus] = useState('loading');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) { setStatus('failed'); return; }

    paymentService.verify(reference)
      .then(({ data }) => {
        const verifiedOrderId = data.data?.orderId;
        setOrderId(verifiedOrderId);

        const pending = consumePendingCheckout();
        if (pending) {
          if (pending.clearAll) clearCart();
          else if (pending.vendorId) clearVendorItems(pending.vendorId);
        }

        setStatus('success');
        setTimeout(() => navigate(`/orders/${verifiedOrderId}`), 3000);
      })
      .catch(() => setStatus('failed'));
  }, [searchParams, navigate, clearCart, clearVendorItems]);

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
            <p className="text-brand-muted text-sm mb-6">
              We couldn&apos;t verify your payment. Your cart is still saved — you can try again from your orders or cart.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/orders" className="btn-secondary">My Orders</Link>
              <Link to="/cart" className="btn-primary">Back to Cart</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
