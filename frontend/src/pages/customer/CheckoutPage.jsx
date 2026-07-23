import { useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Truck,
  ShoppingBag,
  Store,
  Coins,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  MapPin,
  Clock3,
  Gift,
  Wallet,
  CheckCircle2,
  Sparkles,
  Phone,
  Home,
  Building2,
  ArrowRight,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import { useRewardStore } from '../../store/rewardStore';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { rewardService } from '../../services/rewardService';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'wallet',           label: 'Wallet Balance',       icon: Wallet,      disabled: true, helper: 'Rewards apply automatically. Full wallet checkout is coming soon.' },
  { value: 'paystack',         label: 'Pay Online (Paystack)', icon: CreditCard },
  { value: 'cash_on_delivery', label: 'Cash on Delivery',      icon: Truck      },
];

// 10 coins = ₦100 discount
const COIN_RATE = 10;

export default function CheckoutPage() {
  const { items, vendorGroups, clearCart, clearVendorItems } = useCart();
  const { user }                         = useAuthStore();
  const { balance, decrementBalance }    = useRewardStore();
  const navigate                         = useNavigate();
  const location                         = useLocation();
  const [searchParams]                   = useSearchParams();

  const targetVendorId = searchParams.get('vendor') || location.state?.vendorId || null;

  const groupsToCheckout = useMemo(() => {
    if (!targetVendorId) return vendorGroups;
    return vendorGroups.filter((g) => g.vendorId === targetVendorId);
  }, [vendorGroups, targetVendorId]);

  const checkoutItems = groupsToCheckout.flatMap((g) => g.items);
  const subtotal      = groupsToCheckout.reduce((s, g) => s + g.subtotal, 0);
  const deliveryFee   = 500 * groupsToCheckout.length;

  const [form, setForm] = useState({
    deliveryAddress: user?.address || '',
    deliveryPhone:   user?.phone   || '',
    notes:           '',
    paymentMethod:   'paystack',
  });
  const [loading,       setLoading]       = useState(false);
  const [coinsToRedeem, setCoinsToRedeem] = useState(0);
  const [showCoins,     setShowCoins]     = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [successState, setSuccessState] = useState(null);

  // Max redeemable: all balance, but coin discount can't exceed subtotal
  const maxRedeemable = Math.min(balance, Math.floor(subtotal / 100) * COIN_RATE);
  const coinDiscount  = Math.floor(coinsToRedeem / COIN_RATE) * 100;
  const serviceFee    = Math.round(subtotal * 0.03);
  const total         = Math.max(0, subtotal + deliveryFee - coinDiscount);
  const grandTotal    = Math.max(0, subtotal + deliveryFee + serviceFee - coinDiscount);
  const estimatedPoints = Math.floor(subtotal / 200);
  const estimatedEta = `${22 + groupsToCheckout.length * 4}-${34 + groupsToCheckout.length * 6} min`;
  const savedAddresses = [
    {
      id: 'primary',
      label: 'Primary Address',
      icon: Home,
      address: user?.address || '',
      phone: user?.phone || '',
      helper: 'Saved from your profile',
    },
    {
      id: 'work',
      label: 'Work / Office',
      icon: Building2,
      address: user?.address ? `${user.address} (Work)` : '',
      phone: user?.phone || '',
      helper: 'Quick fill option',
    },
  ].filter((item) => item.address);

  if (checkoutItems.length === 0) { navigate('/cart'); return null; }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const paymentMethodForSubmit = form.paymentMethod === 'wallet' ? 'paystack' : form.paymentMethod;

  const applySavedAddress = (address) => {
    setForm((prev) => ({
      ...prev,
      deliveryAddress: address.address,
      deliveryPhone: address.phone || prev.deliveryPhone,
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.deliveryAddress.trim()) { toast.error('Please enter your delivery address'); return; }

    const closedGroup = groupsToCheckout.find((g) =>
      g.items.some((i) => i.vendor?.isOpen === false)
    );
    if (closedGroup) {
      toast.error(`${closedGroup.vendorName} is currently closed.`);
      return;
    }

    setLoading(true);
    try {
      // Redeem coins first if applicable
      if (coinsToRedeem > 0) {
        try {
          await rewardService.redeem({ amount: coinsToRedeem });
          decrementBalance(coinsToRedeem);
        } catch {
          toast.error('Could not redeem coins — proceeding without discount');
        }
      }

      const orderIds = [];
      for (const group of groupsToCheckout) {
        const { data } = await orderService.create({
          vendorId:        group.vendorId,
          items:           group.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          deliveryAddress: form.deliveryAddress,
          deliveryPhone:   form.deliveryPhone,
          notes:           form.notes,
        });
        orderIds.push(data.data.id);
      }

      if (paymentMethodForSubmit === 'paystack' && orderIds.length === 1) {
        const { data: payRes } = await paymentService.initialize({ orderId: orderIds[0], method: 'paystack' });
        // Save pending checkout so PaymentVerifyPage can clear the right cart items
        const { savePendingCheckout } = await import('../../utils/checkoutStorage');
        savePendingCheckout({ orderIds, vendorId: targetVendorId, clearAll: !targetVendorId });
        window.location.href = payRes.data.authorizationUrl;
      } else {
        for (const orderId of orderIds) {
          await paymentService.initialize({
            orderId,
            method: paymentMethodForSubmit === 'paystack' ? 'cash_on_delivery' : paymentMethodForSubmit,
          });
        }
        if (targetVendorId) clearVendorItems(targetVendorId); else clearCart();
        setSuccessState({ orderIds });
        toast.success(`Order${orderIds.length > 1 ? 's' : ''} placed! 🎉`);
        setTimeout(() => {
          navigate(orderIds.length === 1 ? `/orders/${orderIds[0]}` : '/orders');
        }, 1600);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  return (
    <MainLayout>
      <div className="page-container page-shell page-shell-mobile-pad">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles size={13} />
              Secure checkout
            </div>
            <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-brand-dark">Checkout</h1>
            <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-2xl">
              Fast, secure, and designed to help you complete your order with confidence.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-orange-100 bg-white px-4 py-3 shadow-card">
            <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">Estimated Delivery</p>
            <p className="font-semibold text-brand-dark mt-1">{estimatedEta}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <ProgressStep
              number="01"
              title="Delivery"
              text="Address, phone, and handoff preference."
              active
            />
            <ProgressStep
              number="02"
              title="Payment"
              text="Choose a secure payment method."
              active
            />
            <ProgressStep
              number="03"
              title="Review"
              text="Confirm totals and place your order."
              active
            />
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1.1fr)_390px] gap-8 items-start">

          {/* ── Form ──────────────────────────────────── */}
          <form onSubmit={handlePlaceOrder} className="space-y-6 min-w-0">

            {/* Delivery */}
            <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-poppins font-semibold text-brand-dark flex items-center gap-2">
                  <Truck size={18} className="text-primary" /> Delivery Details
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <Clock3 size={12} /> ETA {estimatedEta}
                </span>
              </div>

              {savedAddresses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-brand-dark mb-3">Saved addresses</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedAddresses.map((address) => {
                      const Icon = address.icon;
                      const active = form.deliveryAddress === address.address;
                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          className={`text-left rounded-[1.4rem] border p-4 transition-all ${
                            active ? 'border-primary bg-primary/5' : 'border-orange-100 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-9 h-9 rounded-2xl bg-brand-bg text-primary flex items-center justify-center">
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-dark">{address.label}</p>
                              <p className="text-xs text-brand-muted">{address.helper}</p>
                            </div>
                          </div>
                          <p className="text-sm text-brand-muted leading-relaxed">{address.address}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-[minmax(0,1fr)_280px] gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <textarea name="deliveryAddress" value={form.deliveryAddress} onChange={handleChange}
                    placeholder="Enter your full delivery address" rows={4} className="input-field resize-none" required />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-brand-dark mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                      <input type="tel" name="deliveryPhone" value={form.deliveryPhone} onChange={handleChange}
                        placeholder="+234 ..." className="input-field pl-11" />
                    </div>
                  </div>
                  <div className="rounded-[1.4rem] border border-orange-100 bg-brand-bg/60 p-4">
                    <p className="text-sm font-semibold text-brand-dark flex items-center gap-2 mb-1">
                      <MapPin size={15} className="text-primary" /> Delivery preview
                    </p>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {form.deliveryAddress || 'Your typed address will appear here.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-4 flex items-center gap-2">
                <Truck size={18} className="text-primary" /> Delivery Options
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <DeliveryOptionCard
                  active={deliveryOption === 'standard'}
                  onClick={() => setDeliveryOption('standard')}
                  title="Standard Delivery"
                  subtitle={`${estimatedEta} delivery window`}
                  badge="Included"
                />
                <DeliveryOptionCard
                  active={deliveryOption === 'priority'}
                  onClick={() => setDeliveryOption('priority')}
                  title="Priority Delivery"
                  subtitle="Fastest queue placement"
                  badge="Same order flow"
                />
              </div>
              <p className="text-xs text-brand-muted mt-3">
                Delivery timing is coordinated with vendor availability during order confirmation. Existing order logic remains unchanged.
              </p>
            </div>

            {/* Kitchen Coins redemption */}
            {balance >= COIN_RATE && (
              <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card overflow-hidden">
                <button type="button"
                  onClick={() => setShowCoins(!showCoins)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-bg/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center text-xl">🪙</div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-brand-dark">Kitchen Coins</p>
                      <p className="text-xs text-brand-muted">
                        You have <strong className="text-yellow-600">{Math.floor(balance)} coins</strong>
                        {coinsToRedeem > 0 && <span className="text-accent ml-1">· saving {formatPrice(coinDiscount)}</span>}
                      </p>
                    </div>
                  </div>
                  {showCoins ? <ChevronUp size={18} className="text-brand-muted" /> : <ChevronDown size={18} className="text-brand-muted" />}
                </button>

                <AnimatePresence>
                  {showCoins && (
                    <motion.div
                      initial={{ height:0, opacity:0 }}
                      animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-3 border-t border-orange-50">
                        <p className="text-xs text-brand-muted mt-3">
                          Redeem coins for a discount. <strong>10 coins = ₦100 off.</strong> Max: {Math.floor(maxRedeemable)} coins (₦{Math.floor(maxRedeemable/COIN_RATE)*100} off).
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={maxRedeemable}
                            step={COIN_RATE}
                            value={coinsToRedeem}
                            onChange={(e) => setCoinsToRedeem(Number(e.target.value))}
                            className="flex-1 accent-primary"
                          />
                          <span className="text-sm font-bold text-primary w-20 text-right">
                            {coinsToRedeem} 🪙
                          </span>
                        </div>
                        {coinsToRedeem > 0 ? (
                          <div className="flex items-center justify-between bg-accent/10 rounded-xl px-4 py-2.5">
                            <span className="text-sm text-accent font-medium">Discount applied</span>
                            <span className="text-sm font-bold text-accent">-{formatPrice(coinDiscount)}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-brand-muted text-center">
                            Drag slider to use coins
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Payment Method */}
            <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6">
              <h2 className="font-poppins font-semibold text-brand-dark mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon, disabled, helper }) => (
                  <label key={value} className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${
                    disabled
                      ? 'border-orange-100 bg-brand-bg/40 cursor-not-allowed opacity-70'
                      : form.paymentMethod === value ? 'border-primary bg-primary/5 cursor-pointer' : 'border-orange-100 hover:border-primary/40 cursor-pointer'
                  }`}>
                    <input type="radio" name="paymentMethod" value={value}
                      checked={form.paymentMethod === value} onChange={handleChange} className="hidden" disabled={disabled} />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.paymentMethod === value ? 'border-primary' : 'border-orange-200'
                    }`}>
                      {form.paymentMethod === value && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <Icon size={18} className="text-primary mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-brand-dark block">{label}</span>
                      {helper && <span className="text-xs text-brand-muted block mt-1">{helper}</span>}
                    </div>
                  </label>
                ))}
                {groupsToCheckout.length > 1 && paymentMethodForSubmit === 'paystack' && (
                  <p className="text-xs text-brand-muted bg-orange-50 rounded-xl p-3">
                    💡 For multiple vendors, use Cash on Delivery or checkout each vendor separately.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6 space-y-5">
              <h2 className="font-poppins font-semibold text-brand-dark flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Order Notes
              </h2>

              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block">
                  Order Notes <span className="text-brand-muted text-xs font-normal">(optional)</span>
                </label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Special instructions, gate code, preferred drop-off point…" rows={3} className="input-field resize-none" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base shadow-soft">
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order…</>
              ) : (
                <>
                  Place Order{groupsToCheckout.length > 1 ? 's' : ''} — {formatPrice(grandTotal)}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* ── Summary ───────────────────────────────── */}
          <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6 h-fit xl:sticky xl:top-24">
            <h2 className="font-poppins font-bold text-lg text-brand-dark mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" /> Order Summary
            </h2>

            <div className="rounded-[1.5rem] bg-brand-bg/60 border border-orange-100 p-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-primary flex items-center justify-center shadow-soft">
                  <Gift size={17} />
                </div>
                <div>
                  <p className="font-semibold text-brand-dark">You&apos;ll earn {estimatedPoints} reward points</p>
                  <p className="text-sm text-brand-muted mt-1">
                    Estimated arrival: {estimatedEta}. Reward balance available: {Math.floor(balance)} coins.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 mb-4">
              {groupsToCheckout.map((group) => (
                <div key={group.vendorId} className="rounded-[1.4rem] border border-orange-100 p-4">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-brand-dark mb-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Store size={12} className="text-primary" /> {group.vendorName}
                    </span>
                    <span className="text-brand-muted">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const price = Number(item.discountPrice) || Number(item.price);
                      const img   = item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100';
                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          <img src={img} alt={item.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100';}} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-brand-dark truncate">{item.name}</p>
                            <p className="text-xs text-brand-muted">×{item.quantity}</p>
                          </div>
                          <span className="text-xs font-semibold text-brand-dark">{formatPrice(price*item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-brand-muted mt-3">
                    <span>Delivery</span><span>+{formatPrice(500)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-orange-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-brand-muted">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>Delivery{groupsToCheckout.length>1?` ×${groupsToCheckout.length}`:''}</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>Service fee</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              {coinDiscount > 0 && (
                <motion.div initial={{opacity:0,x:10}} animate={{opacity:1,x:0}}
                  className="flex justify-between text-accent font-medium">
                  <span>🪙 Coins discount</span>
                  <span>-{formatPrice(coinDiscount)}</span>
                </motion.div>
              )}
              <div className="flex justify-between font-poppins font-bold text-brand-dark pt-2 border-t border-orange-100">
                <span>Total</span>
                <span className="text-primary text-lg">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {coinDiscount > 0 && (
              <p className="text-xs text-accent text-center mt-3 font-medium">
                🎉 You're saving {formatPrice(coinDiscount)} with Kitchen Coins!
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-5">
              <TrustPill icon={ShieldCheck} label="Secure payment" />
              <TrustPill icon={Clock3} label={estimatedEta} />
              <TrustPill icon={Wallet} label={`${Math.floor(balance)} coins`} />
              <TrustPill icon={CheckCircle2} label="Freshly prepared" />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {successState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-brand-dark/45 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="max-w-md w-full rounded-[2rem] border border-white/30 bg-white p-8 text-center shadow-card"
              >
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="w-20 h-20 mx-auto mb-5 rounded-full bg-accent/10 text-accent flex items-center justify-center"
                >
                  <CheckCircle2 size={42} />
                </motion.div>
                <h3 className="font-poppins font-bold text-2xl text-brand-dark mb-2">Order placed successfully</h3>
                <p className="text-brand-muted text-sm leading-relaxed">
                  Your order is confirmed and being prepared. We&apos;re taking you to your order details now.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-orange-100 bg-white/92 backdrop-blur-2xl p-3 safe-area-pb">
        <div className="page-container flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-brand-muted">Total</p>
            <p className="font-poppins font-bold text-brand-dark">{formatPrice(grandTotal)}</p>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
          >
            {loading ? 'Placing…' : 'Place Order'}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

function ProgressStep({ number, title, text, active }) {
  return (
    <div className={`rounded-[1.5rem] border p-4 ${active ? 'border-primary/25 bg-primary/5' : 'border-orange-100 bg-white'}`}>
      <div className="w-10 h-10 rounded-2xl bg-white text-primary shadow-soft flex items-center justify-center font-semibold text-sm mb-3">
        {number}
      </div>
      <p className="font-semibold text-brand-dark">{title}</p>
      <p className="text-sm text-brand-muted mt-1">{text}</p>
    </div>
  );
}

function DeliveryOptionCard({ active, onClick, title, subtitle, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-[1.4rem] border p-4 transition-all ${
        active ? 'border-primary bg-primary/5' : 'border-orange-100 hover:border-primary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-brand-dark">{title}</p>
          <p className="text-sm text-brand-muted mt-1">{subtitle}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary border border-orange-100">
          {badge}
        </span>
      </div>
    </button>
  );
}

function TrustPill({ icon: Icon, label }) {
  return (
    <div className="rounded-[1.2rem] bg-brand-bg px-3 py-3 text-xs font-semibold text-brand-dark inline-flex items-center gap-2">
      <Icon size={13} className="text-primary flex-shrink-0" />
      <span>{label}</span>
    </div>
  );
}
