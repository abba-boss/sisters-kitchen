import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ShoppingBag } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'paystack', label: 'Pay Online (Paystack)', icon: CreditCard },
  { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: Truck },
];

export default function CheckoutPage() {
  const { items, subtotal, total, clearCart, vendorId } = useCart();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    deliveryAddress: user?.address || '',
    deliveryPhone: user?.phone || '',
    notes: '',
    paymentMethod: 'paystack',
  });
  const [loading, setLoading] = useState(false);

  if (items.length === 0) { navigate('/cart'); return null; }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.deliveryAddress.trim()) { toast.error('Please enter delivery address'); return; }
    setLoading(true);
    try {
      const orderData = {
        vendorId,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        deliveryAddress: form.deliveryAddress,
        deliveryPhone: form.deliveryPhone,
        notes: form.notes,
      };

      const { data: orderRes } = await orderService.create(orderData);
      const order = orderRes.data;

      if (form.paymentMethod === 'paystack') {
        const { data: payRes } = await paymentService.initialize({ orderId: order.id, method: 'paystack' });
        clearCart();
        window.location.href = payRes.data.authorizationUrl;
      } else {
        await paymentService.initialize({ orderId: order.id, method: 'cash_on_delivery' });
        clearCart();
        toast.success('Order placed successfully! 🎉');
        navigate(`/orders/${order.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container py-10">
        <h1 className="section-title mb-8">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="card p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-4 flex items-center gap-2">
                <Truck size={18} className="text-primary" /> Delivery Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Delivery Address *</label>
                  <textarea
                    name="deliveryAddress"
                    value={form.deliveryAddress}
                    onChange={handleChange}
                    placeholder="Enter your full delivery address"
                    rows={2}
                    className="input-field resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Phone Number</label>
                  <input type="tel" name="deliveryPhone" value={form.deliveryPhone} onChange={handleChange} placeholder="+234 ..." className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Order Notes (optional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Special instructions for your order..." rows={2} className="input-field resize-none" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <label key={value} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    form.paymentMethod === value ? 'border-primary bg-primary/5' : 'border-orange-100 hover:border-primary/50'
                  }`}>
                    <input type="radio" name="paymentMethod" value={value} checked={form.paymentMethod === value} onChange={handleChange} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.paymentMethod === value ? 'border-primary' : 'border-orange-200'}`}>
                      {form.paymentMethod === value && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <Icon size={18} className="text-primary" />
                    <span className="text-sm font-medium text-brand-dark">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
              {loading ? 'Placing Order...' : `Place Order – ${formatPrice(total)}`}
            </button>
          </form>

          {/* Summary */}
          <div className="card p-6 h-fit sticky top-24">
            <h2 className="font-poppins font-bold text-lg text-brand-dark mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" /> Order Summary
            </h2>
            <div className="space-y-3 mb-5">
              {items.map((item) => {
                const price = item.discountPrice || item.price;
                const image = item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100';
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-dark truncate">{item.name}</p>
                      <p className="text-xs text-brand-muted">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-dark">{formatPrice(price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-orange-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-brand-muted"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-brand-muted"><span>Delivery</span><span>{formatPrice(500)}</span></div>
              <div className="flex justify-between font-poppins font-bold text-brand-dark pt-2 border-t border-orange-100">
                <span>Total</span><span className="text-primary text-lg">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
