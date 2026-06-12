import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ShoppingBag, Store } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'paystack',          label: 'Pay Online (Paystack)',   icon: CreditCard },
  { value: 'cash_on_delivery',  label: 'Cash on Delivery',        icon: Truck       },
];

export default function CheckoutPage() {
  const { items, vendorGroups, clearCart, clearVendorItems } = useCart();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // vendorId passed from Cart — null means "checkout all vendors"
  const targetVendorId = location.state?.vendorId || null;

  // Determine which groups to checkout
  const groupsToCheckout = useMemo(() => {
    if (!targetVendorId) return vendorGroups;
    return vendorGroups.filter((g) => g.vendorId === targetVendorId);
  }, [vendorGroups, targetVendorId]);

  const checkoutItems = groupsToCheckout.flatMap((g) => g.items);
  const subtotal = groupsToCheckout.reduce((s, g) => s + g.subtotal, 0);
  const deliveryFee = 500 * groupsToCheckout.length;
  const total = subtotal + deliveryFee;

  const [form, setForm] = useState({
    deliveryAddress: user?.address || '',
    deliveryPhone:   user?.phone   || '',
    notes:           '',
    paymentMethod:   'paystack',
  });
  const [loading, setLoading] = useState(false);

  if (checkoutItems.length === 0) { navigate('/cart'); return null; }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.deliveryAddress.trim()) { toast.error('Please enter your delivery address'); return; }
    setLoading(true);

    try {
      const orderIds = [];

      // Create one order per vendor group
      for (const group of groupsToCheckout) {
        const orderData = {
          vendorId:        group.vendorId,
          items:           group.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          deliveryAddress: form.deliveryAddress,
          deliveryPhone:   form.deliveryPhone,
          notes:           form.notes,
        };
        const { data } = await orderService.create(orderData);
        orderIds.push(data.data.id);
      }

      if (form.paymentMethod === 'paystack' && orderIds.length === 1) {
        // Single vendor — redirect to Paystack
        const { data: payRes } = await paymentService.initialize({
          orderId: orderIds[0],
          method:  'paystack',
        });
        // Clear only the checked-out vendor items
        if (targetVendorId) clearVendorItems(targetVendorId);
        else clearCart();

        window.location.href = payRes.data.authorizationUrl;
      } else {
        // COD or multiple vendors — initialize each as COD
        for (const orderId of orderIds) {
          await paymentService.initialize({
            orderId,
            method: form.paymentMethod === 'paystack' ? 'cash_on_delivery' : form.paymentMethod,
          });
        }

        if (targetVendorId) clearVendorItems(targetVendorId);
        else clearCart();

        if (form.paymentMethod === 'paystack' && orderIds.length > 1) {
          toast.success(`${orderIds.length} orders placed! Online payment for multiple vendors coming soon.`);
        } else {
          toast.success(`Order${orderIds.length > 1 ? 's' : ''} placed successfully! 🎉`);
        }

        navigate(orderIds.length === 1 ? `/orders/${orderIds[0]}` : '/orders');
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
          {/* ── Form ──────────────────────────────────── */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">

            {/* Delivery */}
            <div className="card p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-4 flex items-center gap-2">
                <Truck size={18} className="text-primary" /> Delivery Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
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
                  <input
                    type="tel" name="deliveryPhone"
                    value={form.deliveryPhone} onChange={handleChange}
                    placeholder="+234 ..." className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                    Order Notes <span className="text-brand-muted text-xs font-normal">(optional)</span>
                  </label>
                  <textarea
                    name="notes" value={form.notes} onChange={handleChange}
                    placeholder="Special instructions for the vendor…"
                    rows={2} className="input-field resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <label key={value}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.paymentMethod === value
                        ? 'border-primary bg-primary/5'
                        : 'border-orange-100 hover:border-primary/40'
                    }`}>
                    <input
                      type="radio" name="paymentMethod" value={value}
                      checked={form.paymentMethod === value}
                      onChange={handleChange} className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.paymentMethod === value ? 'border-primary' : 'border-orange-200'
                    }`}>
                      {form.paymentMethod === value && (
                        <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                      )}
                    </div>
                    <Icon size={18} className="text-primary" />
                    <span className="text-sm font-medium text-brand-dark">{label}</span>
                  </label>
                ))}
                {groupsToCheckout.length > 1 && form.paymentMethod === 'paystack' && (
                  <p className="text-xs text-brand-muted bg-orange-50 rounded-xl p-3">
                    💡 Online payment works per vendor. For multiple vendors, use Cash on Delivery or checkout each vendor separately.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Order…
                </>
              ) : (
                `Place Order${groupsToCheckout.length > 1 ? 's' : ''} — ${formatPrice(total)}`
              )}
            </button>
          </form>

          {/* ── Summary ───────────────────────────────── */}
          <div className="card p-6 h-fit sticky top-24">
            <h2 className="font-poppins font-bold text-lg text-brand-dark mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" /> Order Summary
            </h2>

            {/* Group breakdown */}
            <div className="space-y-4 mb-4">
              {groupsToCheckout.map((group) => (
                <div key={group.vendorId}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark mb-2">
                    <Store size={12} className="text-primary" />
                    {group.vendorName}
                  </div>
                  <div className="space-y-2 pl-4">
                    {group.items.map((item) => {
                      const price = Number(item.discountPrice) || Number(item.price);
                      const image = item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100';
                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          <img src={image} alt={item.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-brand-dark truncate">{item.name}</p>
                            <p className="text-xs text-brand-muted">×{item.quantity}</p>
                          </div>
                          <span className="text-xs font-semibold text-brand-dark flex-shrink-0">
                            {formatPrice(price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {groupsToCheckout.length > 1 && (
                    <div className="flex justify-between text-xs text-brand-muted mt-2 pl-4">
                      <span>Delivery</span>
                      <span>+{formatPrice(500)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-orange-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-brand-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>Delivery Fee{groupsToCheckout.length > 1 ? ` ×${groupsToCheckout.length}` : ''}</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-poppins font-bold text-brand-dark pt-2 border-t border-orange-100">
                <span>Total</span>
                <span className="text-primary text-lg">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
