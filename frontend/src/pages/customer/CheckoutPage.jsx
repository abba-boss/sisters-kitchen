import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ShoppingBag, Store, MapPin } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { ButtonLoader } from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { formatPrice } from '../../utils/formatters';
import toastHelper, { orderToasts, errorMessages } from '../../utils/toastConfig.jsx';

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

  const [form, setForm] = useState({
    deliveryAddress: user?.address || '',
    deliveryPhone:   user?.phone   || '',
    notes:           '',
    paymentMethod:   'paystack',
    fulfillmentType: 'delivery', // 'delivery' or 'pickup'
  });
  
  // Calculate delivery fee based on fulfillment type
  const deliveryFee = form.fulfillmentType === 'pickup' ? 0 : (500 * groupsToCheckout.length);
  const total = subtotal + deliveryFee;
  const [loading, setLoading] = useState(false);

  if (checkoutItems.length === 0) { navigate('/cart'); return null; }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Validate delivery address only if delivery is selected
    if (form.fulfillmentType === 'delivery' && !form.deliveryAddress.trim()) {
      toastHelper.error(errorMessages.missingFields);
      return;
    }
    
    // Validate vendor has pickup location if pickup is selected
    if (form.fulfillmentType === 'pickup' && groupsToCheckout.length > 1) {
      toastHelper.error('Pickup orders can only be placed with one vendor at a time');
      return;
    }
    
    setLoading(true);

    try {
      const orderIds = [];

      // Create one order per vendor group
      for (const group of groupsToCheckout) {
        const orderData = {
          vendorId:        group.vendorId,
          items:           group.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          deliveryAddress: form.fulfillmentType === 'delivery' ? form.deliveryAddress : null,
          deliveryPhone:   form.deliveryPhone,
          notes:           form.notes,
          fulfillmentType: form.fulfillmentType,
        };
        
        try {
          const { data } = await orderService.create(orderData);
          orderIds.push(data.data.id);
        } catch (orderError) {
          // Use user-friendly error message from API interceptor
          const errorMsg = orderError.userMessage || orderError.response?.data?.message;
          
          // Handle specific error cases
          if (errorMsg && errorMsg.includes('Insufficient stock')) {
            toastHelper.error(errorMsg, { duration: 5000 });
          } else if (errorMsg && errorMsg.includes('not found')) {
            toastHelper.error('One or more products are no longer available');
          } else if (errorMsg && errorMsg.includes('does not offer pickup')) {
            toastHelper.error('This vendor does not offer pickup service. Please choose delivery.');
          } else {
            toastHelper.error(errorMsg || errorMessages.orderFailed);
          }
          setLoading(false);
          return; // Stop processing if any order fails
        }
      }

      if (form.paymentMethod === 'paystack' && orderIds.length === 1) {
        // Single vendor — redirect to Paystack
        try {
          const { data: payRes } = await paymentService.initialize({
            orderId: orderIds[0],
            method:  'paystack',
          });
          
          // Store pending checkout info for verification page to clear cart
          sessionStorage.setItem('pendingOrderIds', JSON.stringify(orderIds));
          sessionStorage.setItem('pendingVendorId', targetVendorId || 'all');

          window.location.href = payRes.data.authorizationUrl;
        } catch (paymentError) {
          toastHelper.error(errorMessages.paymentFailed);
          setLoading(false);
          return;
        }
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
          toastHelper.success(`${orderIds.length} orders placed! Online payment for multiple vendors coming soon.`, { duration: 6000 });
        } else {
          orderToasts.placed();
        }

        navigate(orderIds.length === 1 ? `/orders/${orderIds[0]}` : '/orders');
      }
    } catch (err) {
      toastHelper.error(err.userMessage || err.response?.data?.message || errorMessages.orderFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <BackButton to="/cart" label="Back to Cart" className="mb-3" />
          <h1 className="section-title text-xl sm:text-2xl">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── Form ──────────────────────────────────── */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Fulfillment Type */}
            <div className="card p-4 sm:p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px] text-primary" /> Fulfillment Method
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { value: 'delivery', label: 'Delivery', icon: Truck, desc: 'Have your order delivered to your doorstep' },
                  { value: 'pickup', label: 'Self-Pickup', icon: MapPin, desc: 'Pick up your order from the vendor location' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <label key={value}
                    className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${
                      form.fulfillmentType === value
                        ? 'border-primary bg-primary/5'
                        : 'border-orange-100 hover:border-primary/40'
                    }`}>
                    <input
                      type="radio" name="fulfillmentType" value={value}
                      checked={form.fulfillmentType === value}
                      onChange={handleChange} className="hidden"
                    />
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      form.fulfillmentType === value ? 'border-primary' : 'border-orange-200'
                    }`}>
                      {form.fulfillmentType === value && (
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full" />
                      )}
                    </div>
                    <Icon size={16} className="sm:w-[18px] sm:h-[18px] text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-brand-dark block">{label}</span>
                      <span className="text-xs text-brand-muted block">{desc}</span>
                      {value === 'pickup' && groupsToCheckout.length > 1 && (
                        <span className="text-xs text-orange-500 block mt-1">
                          ⚠️ Pickup available for single vendor only
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {form.fulfillmentType === 'pickup' && (
                <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-accent/10 rounded-xl">
                  <p className="text-xs text-accent font-medium flex items-center gap-1.5">
                    ✨ No delivery fee for pickup orders!
                  </p>
                </div>
              )}
            </div>

            {/* Delivery */}
            {form.fulfillmentType === 'delivery' && (
              <div className="card p-4 sm:p-6">
                <h2 className="font-poppins font-semibold text-brand-dark mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Truck size={16} className="sm:w-[18px] sm:h-[18px] text-primary" /> Delivery Details
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-brand-dark mb-1.5 block">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={form.deliveryAddress}
                      onChange={handleChange}
                      placeholder="Enter your full delivery address"
                      rows={2}
                      className="input-field resize-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-brand-dark mb-1.5 block">Phone Number</label>
                    <input
                      type="tel" name="deliveryPhone"
                      value={form.deliveryPhone} onChange={handleChange}
                      placeholder="+234 ..." className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info for Pickup */}
            {form.fulfillmentType === 'pickup' && (
              <div className="card p-4 sm:p-6">
                <h2 className="font-poppins font-semibold text-brand-dark mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px] text-primary" /> Contact Information
                </h2>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-brand-dark mb-1.5 block">Phone Number</label>
                  <input
                    type="tel" name="deliveryPhone"
                    value={form.deliveryPhone} onChange={handleChange}
                    placeholder="+234 ..." className="input-field text-sm"
                  />
                  <p className="text-xs text-brand-muted mt-1.5">Vendor may contact you when order is ready</p>
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="card p-4 sm:p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-3 sm:mb-4 text-sm sm:text-base">
                Order Notes <span className="text-brand-muted text-xs font-normal">(optional)</span>
              </h2>
              <textarea
                name="notes" value={form.notes} onChange={handleChange}
                placeholder="Special instructions for the vendor…"
                rows={2} className="input-field resize-none text-sm"
              />
            </div>

            {/* Payment */}
            <div className="card p-4 sm:p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <CreditCard size={16} className="sm:w-[18px] sm:h-[18px] text-primary" /> Payment Method
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <label key={value}
                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${
                      form.paymentMethod === value
                        ? 'border-primary bg-primary/5'
                        : 'border-orange-100 hover:border-primary/40'
                    }`}>
                    <input
                      type="radio" name="paymentMethod" value={value}
                      checked={form.paymentMethod === value}
                      onChange={handleChange} className="hidden"
                    />
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.paymentMethod === value ? 'border-primary' : 'border-orange-200'
                    }`}>
                      {form.paymentMethod === value && (
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full" />
                      )}
                    </div>
                    <Icon size={16} className="sm:w-[18px] sm:h-[18px] text-primary" />
                    <span className="text-sm font-medium text-brand-dark">{label}</span>
                  </label>
                ))}
                {groupsToCheckout.length > 1 && form.paymentMethod === 'paystack' && (
                  <p className="text-xs text-brand-muted bg-orange-50 rounded-xl p-2.5 sm:p-3">
                    💡 Online payment works per vendor. For multiple vendors, use Cash on Delivery or checkout each vendor separately.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base disabled:opacity-70"
            >
              {loading ? (
                <ButtonLoader />
              ) : (
                `Place Order${groupsToCheckout.length > 1 ? 's' : ''} — ${formatPrice(total)}`
              )}
            </button>
          </form>

          {/* ── Summary ───────────────────────────────── */}
          <div className="card p-4 sm:p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-poppins font-bold text-base sm:text-lg text-brand-dark mb-3 sm:mb-4 flex items-center gap-2">
              <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px] text-primary" /> Order Summary
            </h2>

            {/* Group breakdown */}
            <div className="space-y-3 sm:space-y-4 mb-4">
              {groupsToCheckout.map((group) => (
                <div key={group.vendorId}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark mb-2">
                    <Store size={11} className="text-primary" />
                    <span className="truncate">{group.vendorName}</span>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 pl-3 sm:pl-4">
                    {group.items.map((item) => {
                      const price = Number(item.discountPrice) || Number(item.price);
                      const image = item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100';
                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          <img src={image} alt={item.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0"
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
                    <div className="flex justify-between text-xs text-brand-muted mt-2 pl-3 sm:pl-4">
                      <span>Delivery</span>
                      <span>+{formatPrice(500)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-orange-100 pt-3 sm:pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-brand-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span className="flex-1 min-w-0">
                  {form.fulfillmentType === 'pickup' ? (
                    <>Delivery Fee <span className="text-accent font-medium text-xs">(Free!)</span></>
                  ) : (
                    <>Delivery Fee{groupsToCheckout.length > 1 ? ` ×${groupsToCheckout.length}` : ''}</>
                  )}
                </span>
                <span className={`${form.fulfillmentType === 'pickup' ? 'line-through text-brand-muted' : ''} flex-shrink-0 ml-2`}>
                  {formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between font-poppins font-bold text-brand-dark pt-2 border-t border-orange-100">
                <span>Total</span>
                <span className="text-primary text-base sm:text-lg">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
