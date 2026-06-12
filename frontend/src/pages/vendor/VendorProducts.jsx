import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    setLoading(true);
    productService.getMyProducts()
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productService.delete(deleteTarget.id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAvailable = async (product) => {
    try {
      const fd = new FormData();
      fd.append('isAvailable', String(!product.isAvailable));
      await productService.update(product.id, fd);
      toast.success(`Product ${product.isAvailable ? 'hidden' : 'visible'}`);
      fetchProducts();
    } catch { toast.error('Failed to update product'); }
  };

  return (
    <DashboardLayout>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete product?"
        message={deleteTarget ? `"${deleteTarget.name}" will be permanently removed from your menu.` : ''}
        confirmLabel="Delete"
        loading={deleting}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">My Products</h1>
          <p className="text-brand-muted text-sm">{products.length} products</p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary flex items-center gap-2 py-2.5 text-sm">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" message="Start adding your delicious dishes!" actionLabel="Add First Product" actionTo="/vendor/products/new" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product, i) => {
            const image = product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300';
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`card overflow-hidden ${!product.isAvailable ? 'opacity-60' : ''}`}>
                <div className="relative h-40">
                  <img src={image} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <span className="font-poppins font-bold text-white text-lg">{formatPrice(product.discountPrice || product.price)}</span>
                    {!product.isAvailable && <span className="badge bg-black/50 text-white text-xs">Hidden</span>}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-brand-dark text-sm mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-brand-muted mb-3">{product.category?.name} · {product.totalOrders} orders</p>
                  <div className="flex items-center gap-2">
                    <Link to={`/vendor/products/${product.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all">
                      <Edit size={13} /> Edit
                    </Link>
                    <button onClick={() => handleToggleAvailable(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-bg text-brand-muted text-xs font-semibold hover:bg-orange-100 transition-all">
                      {product.isAvailable ? <EyeOff size={13} /> : <Eye size={13} />}
                      {product.isAvailable ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-all"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
