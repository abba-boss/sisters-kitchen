import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  Store, Lock, ShieldCheck, CheckCircle2, Clock3,
  MapPin, Sparkles, Truck, Gift, ChevronDown,
  Bookmark, Tag, Soup, IceCream2, CupSoda, PackageCheck,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/common/ProductCard';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useRewardStore } from '../../store/rewardStore';
import { formatPrice } from '../../utils/formatters';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

export default function CartPage() {
  const {
    items, savedItems, vendorGroups, subtotal,
    updateQuantity, removeFromCart, clearCart,
    setItemNote, saveForLater,
  } = useCart();
  const { isAuthenticated, user } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);
  const rewardBalance = useRewardStore((s) => Number(s.balance || 0));
  const navigate = useNavigate();
  const checkoutVendorRef = useRef(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const handleCheckout = (vendorId = null) => {
    checkoutVendorRef.current = vendorId;
    const checkoutPath = vendorId ? `/checkout?vendor=${vendorId}` : '/checkout';
    if (isAuthenticated) {
      navigate(checkoutPath, { state: { vendorId } });
      return;
    }
    openAuth('Sign in to place your order — your cart is saved!', () => {
      const vid = checkoutVendorRef.current;
      navigate(vid ? `/checkout?vendor=${vid}` : '/checkout', { state: { vendorId: vid } });
    });
  };

  // Only refetch suggestions when the set of cart products actually changes,
  // not on every quantity tick.
  const cartProductIds = useMemo(
    () => items.map((item) => item.id).sort().join(','),
    [items]
  );

  useEffect(() => {
    let mounted = true;
    setLoadingSuggestions(true);
    productService.getFeatured()
      .then(({ data }) => {
        if (!mounted) return;
        const cartIds = new Set(items.map((item) => item.id));
        setSuggestions((data.data || []).filter((item) => !cartIds.has(item.id)).slice(0, 12));
      })
      .catch(() => {
        if (!mounted) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (mounted) setLoadingSuggestions(false);
      });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartProductIds]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const deliveryFee = vendorGroups.length * 500;
  const discountAmount = items.reduce((sum, item) => {
    if (!item.discountPrice) return sum;
    return sum + (Number(item.price) - Number(item.discountPrice)) * item.quantity;
  }, 0);
  const grandTotal = subtotal + deliveryFee;
  const estimatedPoints = Math.floor(grandTotal / 100);
  const addressPreview = user?.address || 'Set your delivery address at checkout';
  const suggestionGroups = useMemo(() => ([
    { key: 'together', title: 'Frequently Bought Together', icon: Soup, items: suggestions.slice(0, 4) },
    { key: 'drinks', title: 'Drinks You May Like', icon: CupSoda, items: suggestions.slice(4, 8) },
    { key: 'desserts', title: 'Desserts & Treats', icon: IceCream2, items: suggestions.slice(8, 12) },
  ]), [suggestions]);

  const toggleGroup = (vendorId) => {
    setCollapsedGroups((prev) => ({ ...prev, [vendorId]: !prev[vendorId] }));
  };

  const handleSaveForLater = (item) => {
    if (saveForLater(item.lineKey)) toast.success(`${item.name} saved for later`);
  };
  return (
    <MainLayout>
      <div className="page-container page-shell page-shell-mobile-pad">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles size={13} />
              Premium checkout
            </div>
            <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-brand-dark">Your Shopping Cart</h1>
            <p className="text-brand-muted mt-2 max-w-2xl text-sm sm:text-base">
              Review your items, compare vendor delivery windows, and move to checkout with confidence.
            </p>
          </div>
          {items.length > 0 && (
            <div className="rounded-[1.5rem] border border-orange-100 bg-white px-4 py-3 shadow-card">
              <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">Cart Snapshot</p>
              <p className="font-semibold text-brand-dark mt-1">
                {totalItems} item{totalItems !== 1 ? 's' : ''} {vendorGroups.length > 1 ? `across ${vendorGroups.length} kitchens` : 'ready to order'}
              </p>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <>
            <PremiumEmptyCart />
            {savedItems.length > 0 && <SavedForLaterSection />}
          </>
        ) : (
          <div className="grid xl:grid-cols-[minmax(0,1.15fr)_380px] gap-8 items-start">
            <div className="space-y-6 min-w-0">
              <div className="grid md:grid-cols-3 gap-4">
                <TopMetric icon={Truck} title="Delivery ETA" value={`${18 + vendorGroups.length * 6}-${28 + vendorGroups.length * 8} min`} />
                <TopMetric icon={Store} title="Active Kitchens" value={`${vendorGroups.length} vendor${vendorGroups.length > 1 ? 's' : ''}`} />
                <TopMetric icon={Gift} title="Reward Points" value={`+${estimatedPoints} on checkout`} />
              </div>

              {vendorGroups.map((group) => (
                <section key={group.vendorId} className="rounded-[2rem] border border-orange-100 bg-white shadow-card overflow-hidden">
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-white via-orange-50/60 to-primary/5 border-b border-orange-100">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <Link
                          to={`/vendors/${group.vendorId}`}
                          className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shadow-soft flex-shrink-0"
                        >
                          {group.vendorLogo ? (
                            <img src={group.vendorLogo} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="text-primary font-bold">{group.vendorName?.[0]}</span>
                          )}
                        </Link>
                        <div className="min-w-0">
                          <Link to={`/vendors/${group.vendorId}`} className="font-poppins font-semibold text-lg text-brand-dark flex items-center gap-2 hover:text-primary transition-colors">
                            <span className="truncate">{group.vendorName}</span>
                            <ShieldCheck size={15} className="text-accent flex-shrink-0" />
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                            <span className="inline-flex items-center gap-1"><Clock3 size={12} className="text-primary" /> {18 + group.items.length * 4}-{26 + group.items.length * 6} min</span>
                            <span className="inline-flex items-center gap-1"><Truck size={12} className="text-primary" /> Delivery</span>
                            <span className="inline-flex items-center gap-1"><PackageCheck size={12} className="text-primary" /> {group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">Kitchen subtotal</p>
                          <p className="font-poppins font-bold text-lg text-brand-dark">{formatPrice(group.subtotal)}</p>
                        </div>
                        <button
                          onClick={() => toggleGroup(group.vendorId)}
                          className="w-11 h-11 rounded-2xl bg-white border border-orange-100 text-brand-muted hover:text-primary transition-colors flex items-center justify-center"
                        >
                          <motion.span animate={{ rotate: collapsedGroups[group.vendorId] ? 180 : 0 }}>
                            <ChevronDown size={18} />
                          </motion.span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {!collapsedGroups[group.vendorId] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-orange-50">
                          {group.items.map((item) => {
                            const price = Number(item.discountPrice) || Number(item.price);
                            const image = item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300';
                            const originalTotal = Number(item.price) * item.quantity;
                            const eta = `${16 + item.quantity * 2}-${24 + item.quantity * 3} min`;
                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 24, height: 0 }}
                                className="p-4 sm:p-5"
                              >
                                <div className="flex gap-4 sm:gap-5 items-start">
                                  <Link to={`/products/${item.id}`} className="w-[104px] h-[104px] sm:w-[120px] sm:h-[120px] rounded-[1.4rem] overflow-hidden bg-brand-bg flex-shrink-0">
                                    <img
                                      src={image}
                                      alt={item.name}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300'; }}
                                    />
                                  </Link>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="min-w-0">
                                        <Link to={`/products/${item.id}`} className="font-semibold text-brand-dark text-base leading-snug line-clamp-2 hover:text-primary transition-colors">
                                          {item.name}
                                        </Link>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1">
                                            <Clock3 size={11} className="text-primary" /> ETA {eta}
                                          </span>
                                          {item.discountPrice && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2.5 py-1 font-semibold">
                                              <Tag size={11} /> Saved {formatPrice(Number(item.price) - Number(item.discountPrice))}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeFromCart(item.id, item.lineKey)}
                                        className="w-10 h-10 rounded-2xl bg-brand-bg text-brand-muted hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                                      <p className="text-sm text-brand-muted">
                                        {formatPrice(price)} each
                                        {item.discountPrice && (
                                          <span className="line-through text-brand-muted/60 ml-1.5">
                                            {formatPrice(item.price)}
                                          </span>
                                        )}
                                      </p>
                                      <p className="font-poppins font-bold text-brand-dark">{formatPrice(price * item.quantity)}</p>
                                      {item.discountPrice && (
                                        <p className="text-xs font-semibold text-accent">
                                          Before {formatPrice(originalTotal)}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex items-center gap-1.5 bg-brand-bg rounded-2xl p-1">
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.lineKey)}
                                          className="w-9 h-9 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all text-brand-muted"
                                        >
                                          <Minus size={14} />
                                        </button>
                                        <span className="font-bold text-sm w-8 text-center text-brand-dark">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.lineKey)}
                                          className="w-9 h-9 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all text-brand-muted"
                                        >
                                          <Plus size={14} />
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => handleSaveForLater(item)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-bg text-brand-muted hover:text-primary transition-colors"
                                      >
                                        <Bookmark size={13} />
                                        Save for later
                                      </button>
                                    </div>

                                    <div className="mt-4">
                                      <label className="text-xs font-semibold text-brand-dark mb-2 block">
                                        Special instructions
                                      </label>
                                      <textarea
                                        value={item.notes || ''}
                                        onChange={(e) => setItemNote(item.lineKey, e.target.value)}
                                        rows={2}
                                        placeholder="Add preferences for checkout, like less pepper or extra cutlery."
                                        className="input-field resize-none text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        <div className="px-5 sm:px-6 py-4 border-t border-orange-100 bg-brand-bg/35 flex items-center justify-between gap-4 flex-wrap">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">Kitchen total</p>
                            <p className="font-semibold text-brand-dark">
                              {formatPrice(group.subtotal)}
                              <span className="text-brand-muted font-normal"> + {formatPrice(500)} delivery</span>
                            </p>
                          </div>
                          {vendorGroups.length > 1 && (
                            <button
                              onClick={() => handleCheckout(group.vendorId)}
                              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                            >
                              {isAuthenticated ? 'Checkout this kitchen' : 'Sign in for this kitchen'}
                              <ArrowRight size={15} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              ))}

              <section className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h2 className="font-poppins font-bold text-2xl text-brand-dark">Suggested Add-ons</h2>
                    <p className="text-sm text-brand-muted mt-1">Round out your order with crowd favorites.</p>
                  </div>
                  <Link to="/products" className="text-sm font-semibold text-primary hover:underline">
                    Browse more food
                  </Link>
                </div>

                {loadingSuggestions ? (
                  <div className="space-y-5">
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <div key={idx}>
                        <div className="h-5 w-44 rounded-full bg-orange-100 animate-pulse mb-3" />
                        <div className="flex gap-4 overflow-hidden">
                          {Array.from({ length: 3 }).map((__, cardIdx) => (
                            <div key={cardIdx} className="min-w-[240px] rounded-[1.6rem] border border-orange-100 bg-brand-bg/50 p-4">
                              <div className="h-36 rounded-[1.2rem] bg-orange-100 animate-pulse mb-3" />
                              <div className="h-4 w-3/4 rounded-full bg-orange-100 animate-pulse mb-2" />
                              <div className="h-4 w-1/2 rounded-full bg-orange-100 animate-pulse" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {suggestionGroups.map(({ key, title, icon: Icon, items: groupItems }) => (
                      groupItems.length > 0 && (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                              <Icon size={15} />
                            </div>
                            <h3 className="font-semibold text-brand-dark">{title}</h3>
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                            {groupItems.map((item) => (
                              <div key={item.id} className="min-w-[260px] max-w-[260px] snap-start">
                                <ProductCard product={item} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </section>

              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-600 hover:underline inline-flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} /> Clear entire cart
              </button>
            </div>

            <aside className="xl:sticky xl:top-24 space-y-5">
              <div className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">Order Summary</p>
                    <h2 className="font-poppins font-bold text-2xl text-brand-dark">Ready to checkout</h2>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatPrice(grandTotal)}</span>
                </div>

                <div className="rounded-[1.5rem] border border-orange-100 bg-brand-bg/60 p-4 mb-5">
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-white text-primary flex items-center justify-center shadow-soft">
                      <MapPin size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-dark">Delivery to your address</p>
                      <p className="text-sm text-brand-muted mt-1">
                        {addressPreview}
                      </p>
                      <p className="text-xs text-primary font-semibold mt-2">
                        Delivery window confirmed by each kitchen
                      </p>
                    </div>
                  </div>
                </div>

                {vendorGroups.length > 1 && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-orange-100">
                    {vendorGroups.map((g) => (
                      <div key={g.vendorId} className="flex justify-between text-xs text-brand-muted gap-3">
                        <span className="inline-flex items-center gap-1 min-w-0">
                          <Store size={11} className="text-primary flex-shrink-0" />
                          <span className="truncate">{g.vendorName}</span>
                        </span>
                        <span className="font-medium text-brand-dark flex-shrink-0">{formatPrice(g.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 text-sm mb-5">
                  <SummaryRow label="Items subtotal" value={formatPrice(subtotal)} />
                  <SummaryRow
                    label={`Delivery fee${vendorGroups.length > 1 ? ` (${vendorGroups.length} kitchens)` : ''}`}
                    value={formatPrice(deliveryFee)}
                  />

                  <SummaryRow label="Product savings included" value={`-${formatPrice(discountAmount)}`} positive />
                   <div className="rounded-[1.2rem] bg-accent/10 text-accent px-4 py-3 text-xs font-semibold flex items-center gap-2">
                    <Gift size={14} />
                    Earn approximately {estimatedPoints} points after checkout.
                  </div>
                  <div className="border-t border-orange-100 pt-3 flex justify-between items-end gap-3">
                    <div>
                      <p className="font-semibold text-brand-dark">Grand Total</p>
                      <p className="text-xs text-brand-muted">Taxes and final vendor availability are confirmed at checkout.</p>
                    </div>
                    <span className="font-poppins font-bold text-2xl text-primary">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(null)}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
                >
                  {isAuthenticated ? (
                    <>
                      Proceed to Checkout
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Sign In to Checkout
                    </>
                  )}
                </button>

                {!isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-primary/5 rounded-2xl flex items-start gap-2"
                  >
                    <ShieldCheck size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-brand-muted leading-relaxed">
                      <strong className="text-brand-dark">Free account, 30 seconds.</strong>{' '}
                      Your cart items are saved and waiting!
                    </p>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <TrustPill icon={ShieldCheck} label="Secure checkout" />
                  <TrustPill icon={CheckCircle2} label="Freshly prepared" />
                  <TrustPill icon={Truck} label="Track your order" />
                  <TrustPill icon={Gift} label={`${Math.floor(rewardBalance)} Kitchen Coins`} />
                </div>

                <Link
                  to="/products"
                  className="block text-center text-sm text-brand-muted hover:text-primary mt-3 transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </aside>
          </div>
        )}

        {items.length > 0 && savedItems.length > 0 && <SavedForLaterSection />}
      </div>

      {items.length > 0 && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-orange-100 bg-white/92 backdrop-blur-2xl p-3 safe-area-pb">
          <div className="page-container flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs text-brand-muted">Grand total</p>
              <p className="font-poppins font-bold text-brand-dark">{formatPrice(grandTotal)}</p>
            </div>
            <button
              onClick={() => handleCheckout(null)}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              {isAuthenticated ? 'Checkout' : 'Sign In to Checkout'}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function SavedForLaterSection() {
  const { savedItems, moveToCart, removeSavedItem } = useCart();

  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white shadow-card p-5 sm:p-6 mt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-poppins font-bold text-xl text-brand-dark flex items-center gap-2">
            <Bookmark size={17} className="text-primary" /> Saved for later
          </h2>
          <p className="text-sm text-brand-muted mt-1">
            Still available — move an item back whenever you are ready.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {savedItems.map((item) => {
          const price = Number(item.discountPrice) || Number(item.price);
          return (
            <div key={item.lineKey} className="flex items-center gap-3 rounded-[1.4rem] border border-orange-100 p-3">
              <img
                src={item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100'}
                alt={item.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-dark truncate">{item.name}</p>
                <p className="text-xs text-brand-muted">
                  {item.vendor?.businessName || 'Kitchen'} · {formatPrice(price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (moveToCart(item.lineKey)) toast.success(`${item.name} moved to your cart`);
                    else toast.error('That item is already in your cart');
                  }}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  Move to cart
                </button>
                <button
                  onClick={() => removeSavedItem(item.lineKey)}
                  aria-label={`Remove ${item.name}`}
                  className="rounded-xl bg-brand-bg p-2 text-brand-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PremiumEmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2.25rem] border border-orange-100 bg-white shadow-card overflow-hidden"
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="p-8 sm:p-10 lg:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <ShoppingCart size={13} />
            Your bag is waiting
          </div>
          <h2 className="font-poppins font-bold text-3xl sm:text-4xl text-brand-dark mb-3">
            Your cart is empty, but dinner inspiration is not.
          </h2>
          <p className="text-brand-muted max-w-xl leading-relaxed mb-6">
            Explore trending homemade meals, desserts, refreshing drinks, and trusted kitchens near you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              Browse Food
              <ArrowRight size={16} />
            </Link>
            <Link to="/" className="btn-secondary inline-flex items-center gap-2">
              Discover What&apos;s Popular
            </Link>
          </div>
        </div>
        <div className="min-h-[320px] bg-gradient-to-br from-primary/10 via-orange-50 to-accent/10 p-8 flex items-center justify-center">
          <div className="relative w-full max-w-sm aspect-square">
            <div className="absolute inset-8 rounded-[2rem] bg-white shadow-card rotate-6" />
            <div className="absolute inset-4 rounded-[2rem] bg-white shadow-card -rotate-3" />
            <div className="absolute inset-0 rounded-[2.2rem] bg-white shadow-card p-8 flex flex-col justify-between">
              <div className="w-16 h-16 rounded-[1.6rem] bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingCart size={30} />
              </div>
              <div className="space-y-3">
                <div className="h-4 rounded-full bg-orange-100 w-3/4" />
                <div className="h-4 rounded-full bg-orange-100 w-full" />
                <div className="h-4 rounded-full bg-orange-100 w-2/3" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 rounded-[1.4rem] bg-orange-100/80" />
                <div className="h-20 rounded-[1.4rem] bg-primary/10" />
                <div className="h-20 rounded-[1.4rem] bg-accent/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TopMetric({ icon: Icon, title, value }) {
  return (
    <div className="rounded-[1.6rem] border border-orange-100 bg-white shadow-card p-4">
      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon size={18} />
      </div>
      <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">{title}</p>
      <p className="font-semibold text-brand-dark mt-1">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, positive = false, icon: Icon }) {
  return (
    <div className="flex justify-between items-center gap-3 text-sm">
      <span className="text-brand-muted inline-flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-primary" />}
        {label}
      </span>
      <span className={`font-semibold ${positive ? 'text-accent' : 'text-brand-dark'}`}>{value}</span>
    </div>
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
