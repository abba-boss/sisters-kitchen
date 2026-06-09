import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, Plus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import toast from 'react-hot-toast';

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '',
    categoryId: '', stock: '', preparationTime: '', isAvailable: true,
    isFeatured: false, isFreshToday: false, tags: '',
  });

  useEffect(() => {
    categoryService.getAll().then(({ data }) => setCategories(data.data || [])).catch(() => {});
    if (isEdit) {
      productService.getById(id).then(({ data }) => {
        const p = data.data;
        setForm({
          name: p.name, description: p.description, price: p.price,
          discountPrice: p.discountPrice || '', categoryId: p.category?.id || '',
          stock: p.stock, preparationTime: p.preparationTime || '',
          isAvailable: p.isAvailable, isFeatured: p.isFeatured, isFreshToday: p.isFreshToday,
          tags: p.tags?.join(', ') || '',
        });
        if (p.images?.length) setPreviews(p.images.map((src) => ({ src, file: null })));
      }).catch(() => toast.error('Failed to load product'));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => ({ src: URL.createObjectURL(file), file }));
    setPreviews((p) => [...p, ...newPreviews].slice(0, 5));
  };

  const removePreview = (i) => setPreviews((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') fd.append(k, JSON.stringify(v.split(',').map((t) => t.trim()).filter(Boolean)));
        else fd.append(k, v);
      });
      previews.forEach(({ file }) => { if (file) fd.append('images', file); });

      if (isEdit) {
        await productService.update(id, fd);
        toast.success('Product updated!');
      } else {
        await productService.create(fd);
        toast.success('Product created!');
      }
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-poppins font-bold text-xl text-brand-dark mb-6">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="card p-5">
            <label className="text-sm font-semibold text-brand-dark mb-3 block">Product Images (max 5)</label>
            <div className="flex flex-wrap gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  <img src={p.src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePreview(i)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={18} className="text-white" />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload size={18} className="text-brand-muted mb-1" />
                  <span className="text-xs text-brand-muted">Upload</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-brand-dark text-sm">Product Details</h2>
            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Chicken Shawarma" className="input-field" required />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe your product..." className="input-field resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Price (₦) *</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="2500" className="input-field" required />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Discount Price (₦)</label>
                <input type="number" name="discountPrice" value={form.discountPrice} onChange={handleChange} placeholder="Optional" className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Category</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-brand-dark mb-1 block">Prep Time</label>
                <input type="text" name="preparationTime" value={form.preparationTime} onChange={handleChange} placeholder="e.g. 15-20 mins" className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Stock Quantity</label>
              <input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Tags (comma separated)</label>
              <input type="text" name="tags" value={form.tags} onChange={handleChange} placeholder="spicy, grilled, popular" className="input-field" />
            </div>
          </div>

          {/* Toggles */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-brand-dark text-sm mb-2">Settings</h2>
            {[
              { name: 'isAvailable', label: 'Available for ordering' },
              { name: 'isFeatured', label: 'Mark as featured' },
              { name: 'isFreshToday', label: 'Fresh Today badge' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-brand-dark">{label}</span>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${form[name] ? 'bg-primary' : 'bg-orange-100'}`} onClick={() => setForm((p) => ({ ...p, [name]: !p[name] }))}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[name] ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/vendor/products')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
