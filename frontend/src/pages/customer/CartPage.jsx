import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Store } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import EmptyState from '../../components/common/EmptyState';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/formatters';

export default function CartPage() {
  const { items, subtotal, total, updateQuantity, removeFromCart, clearCart, vendorName } = useCart();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="page-container py-10">
        <h1 className="section-title mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            message="Add some delicious homemade food to your cart!"
            actionLabel="Browse Food"
            actionTo="/products"
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {vendorName && (
                <div className="flex items-center gap-2 text-sm text-brand-muted bg-white rounded-2xl px-4 py-3 shadow-card">
                  <Store size={16} className="text-primary" />
                  <span>Items from <strong className="text-brand-dark">{vendorName}</strong></span>
                </div>
              )}

              <AnimatePresence>
                {items.map((item) => {
                  const price = item.discountPrice || item.price;
                  const image = item.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200';
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="card p-4 flex gap-4"
                    >
                      <img src={image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-brand-dark text-sm mb-1 line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-brand-muted mb-3">{item.vendor?.businessName}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-brand-bg rounded-xl p-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-poppins font-bold text-brand-dark">{formatPrice(price * item.quantity)}</span>
                            <button onClick={() => removeFromCart(item.id)} className="p-2 rounded-xl hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <button onClick={clearCart} className="text-sm text-red-500 hover:underline flex items-center gap-1">
                <Trash2 size={14} /> Clear cart
              </button>
            </div>

            {/* Summary */}
            <div>
              <div className="card p-6 sticky top-24">
                <h2 className="font-poppins font-bold text-lg text-brand-dark mb-5">Order Summary</h2>
                <div className="space-y-3 text-sm mb-5">
                  <div className="flex justify-between text-brand-muted">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-semibold text-brand-dark">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-brand-muted">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-brand-dark">{formatPrice(500)}</span>
                  </div>
                  <div className="border-t border-orange-100 pt-3 flex justify-between">
                    <span className="font-semibold text-brand-dark">Total</span>
                    <span className="font-poppins font-bold text-lg text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
                <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
                <Link to="/products" className="block text-center text-sm text-brand-muted hover:text-primary mt-3 transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
