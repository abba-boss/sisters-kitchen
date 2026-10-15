import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  Store, Lock, ShieldCheck, ChevronRight
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { EmptyCart } from '../../components/common/EmptyState';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { formatPrice } from '../../utils/formatters';

export default function CartPage() {
  const {
    items, vendorGroups, subtotal, total,
    updateQuantity, removeFromCart, clearCart,
  } = useCart();
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);
  const navigate = useNavigate();
  const checkoutVendorRef = useRef(null);

  const handleCheckout = (vendorId = null) => {
    checkoutVendorRef.current = vendorId;
    if (isAuthenticated) {
      navigate('/checkout', { state: { vendorId } });
      return;
    }
    openAuth('Sign in to place your order — your cart is saved!', () => {
      navigate('/checkout', { state: { vendorId: checkoutVendorRef.current } });
    });
  };

  const grandTotal = vendorGroups.reduce((s, g) => s + g.total, 0);

  return (
    <MainLayout>
      <div className="page-container py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
          <h1 className="section-title text-xl sm:text-2xl">Your Cart</h1>
          {items.length > 0 && (
            <span className="text-xs sm:text-sm text-brand-muted">
              {items.reduce((s, i) => s + i.quantity, 0)} items
              {vendorGroups.length > 1 && ` · ${vendorGroups.length} vendors`}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyCart 
            onBrowse={() => navigate('/products')}
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ── Left: Vendor Groups ─────────────────── */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">{vendorGroups.map((group) => (
                <div key={group.vendorId} className="card overflow-hidden">
                  {/* Vendor header */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-orange-50 bg-brand-bg/50">
                    <Link
                      to={`/vendors/${group.vendorId}`}
                      className="flex items-center gap-2 sm:gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1"
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                        {group.vendorLogo ? (
                          <img src={group.vendorLogo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
                            {group.vendorName?.[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-brand-dark flex items-center gap-1 truncate">
                        <Store size={12} sm:size={13} className="text-primary flex-shrink-0" />
                        <span className="truncate">{group.vendorName}</span>
                      </span>
                      <ChevronRight size={12} className="text-brand-muted flex-shrink-0" />
                    </Link>
                    <span className="text-xs font-semibold text-brand-muted flex-shrink-0 ml-2">
                      {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-orange-50">
                    <AnimatePresence initial={false}>
                      {group.items.map((item) => {
                        const price = Number(item.discountPrice) || Number(item.price);
                        const image = item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200';
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            className="flex gap-3 sm:gap-4 p-3 sm:p-4"
                          >
                            <img
                              src={image}
                              alt={item.name}
                              className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-lg sm:rounded-xl object-cover flex-shrink-0"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-brand-dark text-sm leading-snug line-clamp-2 mb-1">
                                {item.name}
                              </h3>
                              <p className="text-xs text-brand-muted mb-2">
                                {formatPrice(price)} each
                                {item.discountPrice && (
                                  <span className="line-through text-brand-muted/60 ml-1.5">
                                    {formatPrice(item.price)}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                {/* Qty */}
                                <div className="flex items-center gap-1.5 bg-brand-bg rounded-lg p-0.5 sm:p-1">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-all text-brand-muted"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="font-bold text-sm w-5 sm:w-6 text-center text-brand-dark">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-all text-brand-muted"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                                {/* Total + remove */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <span className="font-poppins font-bold text-brand-dark text-sm">
                                    {formatPrice(price * item.quantity)}
                                  </span>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-1 sm:p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Per-vendor subtotal + checkout */}
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-orange-50 bg-brand-bg/30 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                    <div className="text-xs sm:text-sm text-brand-muted">
                      Subtotal:{' '}
                      <span className="font-semibold text-brand-dark">{formatPrice(group.subtotal)}</span>
                      <span className="text-xs ml-1 hidden sm:inline">+ ₦500 delivery</span>
                    </div>
                    {vendorGroups.length > 1 && (
                      <button
                        onClick={() => handleCheckout(group.vendorId)}
                        className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-primary-dark transition-all whitespace-nowrap"
                      >
                        {isAuthenticated ? (
                          <>Order <span className="hidden sm:inline">from {group.vendorName?.split("'")[0]}</span> <ArrowRight size={13} /></>
                        ) : (
                          <><Lock size={12} /> Order <span className="hidden sm:inline">from {group.vendorName?.split("'")[0]}</span></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Clear all */}
              <button
                onClick={clearCart}
                className="text-xs sm:text-sm text-red-400 hover:text-red-600 hover:underline flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} /> Clear entire cart
              </button>
            </div>

            {/* ── Right: Grand Summary ────────────────── */}
            <div>
              <div className="card p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="font-poppins font-bold text-base sm:text-lg text-brand-dark mb-4 sm:mb-5">Order Summary</h2>

                {/* Per-vendor breakdown */}
                {vendorGroups.length > 1 && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-orange-100">
                    {vendorGroups.map((g) => (
                      <div key={g.vendorId} className="flex justify-between text-xs text-brand-muted">
                        <span className="flex items-center gap-1 truncate flex-1 mr-2">
                          <Store size={10} className="text-primary flex-shrink-0" />
                          <span className="truncate">{g.vendorName}</span>
                        </span>
                        <span className="font-medium text-brand-dark flex-shrink-0">{formatPrice(g.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2.5 sm:space-y-3 text-sm mb-4 sm:mb-5">
                  <div className="flex justify-between text-brand-muted">
                    <span>Items subtotal</span>
                    <span className="font-semibold text-brand-dark">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-brand-muted">
                    <span>
                      Delivery
                      {vendorGroups.length > 1 && (
                        <span className="text-xs ml-1">(×{vendorGroups.length})</span>
                      )}
                    </span>
                    <span className="font-semibold text-brand-dark">
                      {formatPrice(500 * vendorGroups.length)}
                    </span>
                  </div>
                  <div className="border-t border-orange-100 pt-2.5 sm:pt-3 flex justify-between">
                    <span className="font-semibold text-brand-dark">Total</span>
                    <span className="font-poppins font-bold text-lg sm:text-xl text-primary">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Main checkout CTA */}
                <button
                  onClick={() => handleCheckout(null)}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
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

                {/* Guest message */}
                {!isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 sm:p-3 bg-primary/5 rounded-xl sm:rounded-2xl flex items-start gap-2"
                  >
                    <ShieldCheck size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-brand-muted leading-relaxed">
                      <strong className="text-brand-dark">Free account, 30 seconds.</strong>{' '}
                      Your cart items are saved!
                    </p>
                  </motion.div>
                )}

                <Link
                  to="/products"
                  className="block text-center text-xs sm:text-sm text-brand-muted hover:text-primary mt-3 transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
