import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, ArrowLeft, Save, ImagePlus,
  AlertCircle, Loader, CheckCircle2, Star, Flame
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { uploadImage } from '../../services/cloudinaryService';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

const MAX_IMAGES = 5;

// Image slot: { src: string, file: File|null, url: string|null, uploading: bool, done: bool }
const makeSlot = (src, file = null, url = null) => ({ src, file, url, uploading: false, done: !!url });

export default function ProductForm() {
  const { id }   = useParams();
  const isEdit   = !!id;
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [categories, setCategories] = useState([]);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [slots,  setSlots]    = useState([]); // image slots
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '',
    categoryId: '', stock: '20', preparationTime: '',
    isAvailable: true, isFeatured: false, isFreshToday: false, tags: '',
  });

  // ── Load categories ─────────────────────────────────────────
  useEffect(() => {
    categoryService.getAll()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => toast.error('Could not load categories'));
  }, []);

  // ── Load product if editing ──────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    productService.getById(id)
      .then(({ data }) => {
        const p = data.data;
        setForm({
          name: p.name || '', description: p.description || '',
          price: String(p.price || ''), discountPrice: String(p.discountPrice || ''),
          categoryId: p.category?.id || '', stock: String(p.stock ?? 20),
          preparationTime: p.preparationTime || '',
          isAvailable:  p.isAvailable  ?? true,
          isFeatured:   p.isFeatured   ?? false,
          isFreshToday: p.isFreshToday ?? false,
          tags: (p.tags || []).join(', '),
        });
        if (p.images?.length) {
          setSlots(p.images.map((url) => makeSlot(url, null, url)));
        }
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setPageLoading(false));
  }, [id]);

  // ── Field change ─────────────────────────────────────────────
  const set = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((e) => { const ne = { ...e }; delete ne[name]; return ne; });
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };

  // ── Image handling ────────────────────────────────────────────
  const handleFilePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const available = MAX_IMAGES - slots.length;
    if (available <= 0) { toast.error(`Max ${MAX_IMAGES} images`); return; }

    const picked = files.slice(0, available);
    if (fileRef.current) fileRef.current.value = '';

    // Create pending slots immediately so user sees previews
    const newSlots = picked.map((file) => ({
      src: URL.createObjectURL(file),
      file,
      url: null,
      uploading: true,
      done: false,
    }));
    setSlots((prev) => [...prev, ...newSlots]);

    // Upload each to Cloudinary in background
    for (let i = 0; i < picked.length; i++) {
      const file   = picked[i];
      const slotIdx = slots.length + i; // index in the new combined array

      try {
        const url = await uploadImage(file, 'sisters-kitchen/products');
        setSlots((prev) =>
          prev.map((s, idx) =>
            idx === slotIdx
              ? { ...s, url, uploading: false, done: true }
              : s
          )
        );
      } catch (err) {
        toast.error(`Image ${i + 1} upload failed — will retry on save`);
        setSlots((prev) =>
          prev.map((s, idx) =>
            idx === slotIdx ? { ...s, uploading: false, done: false } : s
          )
        );
      }
    }
  };

  const removeSlot = (idx) => {
    setSlots((prev) => {
      const copy = [...prev];
      if (copy[idx].src?.startsWith('blob:')) URL.revokeObjectURL(copy[idx].src);
      copy.splice(idx, 1);
      return copy;
    });
  };

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Product name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Enter a valid price';
    if (form.discountPrice && Number(form.discountPrice) >= Number(form.price))
      e.discountPrice = 'Discount price must be less than regular price';
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the highlighted errors'); return; }

    // Wait for any still-uploading images
    const stillUploading = slots.some((s) => s.uploading);
    if (stillUploading) { toast.error('Please wait for images to finish uploading'); return; }

    setSaving(true);
    try {
      // For slots that have a Cloudinary URL use it directly;
      // For slots that still have a local file (failed Cloudinary), upload via backend
      const fd = new FormData();

      // Collect URLs of already-uploaded images
      const uploadedUrls = slots
        .filter((s) => s.done && s.url)
        .map((s) => s.url);

      // For slots whose Cloudinary upload failed, attach file for backend upload
      const failedFiles = slots.filter((s) => !s.done && s.file);

      fd.append('name',         form.name.trim());
      fd.append('description',  form.description.trim());
      fd.append('price',        form.price);
      if (form.discountPrice) fd.append('discountPrice', form.discountPrice);
      if (form.categoryId)    fd.append('categoryId',   form.categoryId);
      fd.append('stock',        String(form.stock || 0));
      if (form.preparationTime) fd.append('preparationTime', form.preparationTime);
      fd.append('isAvailable',  String(form.isAvailable));
      fd.append('isFeatured',   String(form.isFeatured));
      fd.append('isFreshToday', String(form.isFreshToday));
      fd.append('tags',         JSON.stringify(
        form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      ));
      // Pass already-uploaded URLs as a JSON array
      fd.append('existingImageUrls', JSON.stringify(uploadedUrls));

      // Attach any failed files for backend to handle
      failedFiles.forEach(({ file }) => fd.append('images', file));

      if (isEdit) {
        await productService.update(id, fd);
        toast.success('Product updated! ✅');
      } else {
        await productService.create(fd);
        toast.success('Product created! 🎉');
      }
      navigate('/vendor/products');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Live price preview ────────────────────────────────────────
  const pricePreview = form.price
    ? formatPrice(Number(form.price))
    : null;
  const discountPreview = form.discountPrice
    ? formatPrice(Number(form.discountPrice))
    : null;
  const saving_pct = form.price && form.discountPrice
    ? Math.round(((Number(form.price) - Number(form.discountPrice)) / Number(form.price)) * 100)
    : 0;

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-orange-50 rounded-2xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">

        {/* ── Header ─────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/products"
            className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-poppins font-bold text-xl text-brand-dark">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-brand-muted mt-0.5">
              {isEdit ? 'Update your product listing' : 'List a new product for customers to order'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Images ─────────────────────────────── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-brand-dark text-sm">
                  Product Photos
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  {slots.length}/{MAX_IMAGES} · First photo is the cover · Uploaded to Cloudinary automatically
                </p>
              </div>
              {slots.length < MAX_IMAGES && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                  <ImagePlus size={14} /> Add Photos
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFilePick}
              className="hidden"
            />

            <div className="flex flex-wrap gap-3 min-h-[96px]">
              <AnimatePresence>
                {slots.map((slot, i) => (
                  <motion.div
                    key={slot.src}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7, height: 0 }}
                    className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 group flex-shrink-0"
                    style={{ borderColor: slot.done ? '#5FA36A' : slot.uploading ? '#FF7A59' : '#FDE8DC' }}
                  >
                    <img
                      src={slot.src}
                      alt={`img-${i}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (!e.target.dataset.retried) {
                          e.target.dataset.retried = '1';
                          e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200';
                        }
                      }}
                    />

                    {/* Uploading spinner */}
                    {slot.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <Loader size={18} className="text-white animate-spin mb-1" />
                        <span className="text-white text-xs">Uploading…</span>
                      </div>
                    )}

                    {/* Done tick */}
                    {slot.done && !slot.uploading && (
                      <div className="absolute top-1 left-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}

                    {/* Cover label */}
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-white text-xs bg-primary/80 py-0.5">
                        Cover
                      </span>
                    )}

                    {/* Remove button */}
                    {!slot.uploading && (
                      <button
                        type="button"
                        onClick={() => removeSlot(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Drop zone */}
              {slots.length < MAX_IMAGES && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all group flex-shrink-0"
                >
                  <Upload size={20} className="text-brand-muted group-hover:text-primary mb-1 transition-colors" />
                  <span className="text-xs text-brand-muted group-hover:text-primary">Upload</span>
                </motion.button>
              )}
            </div>

            {slots.some((s) => s.uploading) && (
              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                <Loader size={11} className="animate-spin" />
                Uploading images to Cloudinary…
              </p>
            )}
            {slots.every((s) => s.done) && slots.length > 0 && (
              <p className="text-xs text-accent mt-2 flex items-center gap-1">
                <CheckCircle2 size={11} />
                All images uploaded successfully
              </p>
            )}
          </div>

          {/* ── Product Details ─────────────────────── */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-brand-dark text-sm">Product Details</h2>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange}
                placeholder="e.g. Chicken Shawarma (Large)"
                maxLength={200}
                className={`input-field ${errors.name ? 'border-red-400 ring-2 ring-red-100' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description" value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="What makes this dish special? Mention ingredients, serving size, flavor profile…"
                className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
              />
              <p className="text-xs text-brand-muted text-right mt-0.5">
                {form.description.length} chars
              </p>
              {errors.description && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 block">
                  Price (₦) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" name="price" value={form.price}
                  onChange={handleChange}
                  placeholder="2500" min="1" step="50"
                  className={`input-field ${errors.price ? 'border-red-400' : ''}`}
                />
                {pricePreview && (
                  <p className="text-xs text-brand-muted mt-0.5">= {pricePreview}</p>
                )}
                {errors.price && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.price}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 flex items-center gap-1">
                  Discount Price (₦)
                  {saving_pct > 0 && (
                    <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                      -{saving_pct}%
                    </span>
                  )}
                </label>
                <input
                  type="number" name="discountPrice" value={form.discountPrice}
                  onChange={handleChange}
                  placeholder="Leave empty = no discount" min="0" step="50"
                  className={`input-field ${errors.discountPrice ? 'border-red-400' : ''}`}
                />
                {discountPreview && (
                  <p className="text-xs text-accent mt-0.5">= {discountPreview}</p>
                )}
                {errors.discountPrice && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.discountPrice}</p>
                )}
              </div>
            </div>

            {/* Category + Prep */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Category</label>
                <select
                  name="categoryId" value={form.categoryId} onChange={handleChange}
                  className="input-field">
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Prep Time</label>
                <input
                  type="text" name="preparationTime" value={form.preparationTime}
                  onChange={handleChange} placeholder="e.g. 15–20 mins"
                  className="input-field"
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">
                Stock Quantity
              </label>
              <input
                type="number" name="stock" value={form.stock}
                onChange={handleChange}
                placeholder="20" min="0"
                className="input-field"
              />
              <p className="text-xs text-brand-muted mt-0.5">
                Set to 0 to pause ordering while keeping the listing visible
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">
                Tags
                <span className="text-brand-muted font-normal ml-1">(comma separated)</span>
              </label>
              <input
                type="text" name="tags" value={form.tags}
                onChange={handleChange}
                placeholder="spicy, grilled, popular, vegetarian…"
                className="input-field"
              />
            </div>
          </div>

          {/* ── Settings ────────────────────────────── */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-brand-dark text-sm mb-1">Listing Settings</h2>

            {[
              {
                name: 'isAvailable',
                icon: CheckCircle2,
                iconClass: 'text-accent',
                label: 'Available for ordering',
                desc: 'Customers can find and add this to their cart',
              },
              {
                name: 'isFeatured',
                icon: Star,
                iconClass: 'text-yellow-500',
                label: 'Featured product',
                desc: 'Promoted on the homepage featured section',
              },
              {
                name: 'isFreshToday',
                icon: Flame,
                iconClass: 'text-orange-500',
                label: '"Fresh Today" badge',
                desc: 'Show a "Fresh Today" badge on the listing',
              },
            ].map(({ name, icon: Icon, iconClass, label, desc }) => (
              <div key={name} className="flex items-center justify-between py-1.5">
                <div className="flex items-start gap-3">
                  <Icon size={17} className={`${iconClass} mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{label}</p>
                    <p className="text-xs text-brand-muted">{desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set(name, !form[name])}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-4 ${
                    form[name] ? 'bg-primary' : 'bg-orange-100'
                  }`}
                  aria-label={label}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', damping: 20, stiffness: 500 }}
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm ${
                      form[name] ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* ── Action Buttons ───────────────────────── */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate('/vendor/products')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || slots.some((s) => s.uploading)}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : slots.some((s) => s.uploading) ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Uploading images…
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? 'Update Product' : 'Publish Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
