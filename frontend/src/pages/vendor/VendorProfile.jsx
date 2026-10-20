import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { vendorService } from '../../services/vendorService';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VendorProfile() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const logoRef = useRef();
  const coverRef = useRef();

  useEffect(() => {
    vendorService.getMyProfile()
      .then(({ data }) => {
        const v = data.data;
        setVendor(v);
        setForm({ 
          businessName: v.businessName || '', 
          description: v.description || '', 
          address: v.address || '', 
          phone: v.phone || '', 
          whatsapp: v.whatsapp || '', 
          openingTime: v.openingTime || '', 
          closingTime: v.closingTime || '', 
          bankName: v.bankName || '', 
          accountNumber: v.accountNumber || '', 
          accountName: v.accountName || '',
          pickupLatitude: v.pickupLatitude || '',
          pickupLongitude: v.pickupLongitude || '',
          pickupInstructions: v.pickupInstructions || '',
          offersDelivery: v.offersDelivery ?? true,
        });
        setSelectedDays(v.availableDays || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggleDay = (day) => setSelectedDays((p) => p.includes(day) ? p.filter((d) => d !== day) : [...p, day]);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'logo') { setLogoFile(file); setLogoPreview(preview); }
    else { setCoverFile(file); setCoverPreview(preview); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('availableDays', JSON.stringify(selectedDays));
      if (logoFile) fd.append('logo', logoFile);
      if (coverFile) fd.append('coverImage', coverFile);
      await vendorService.updateProfile(fd);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout><div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div></DashboardLayout>;

  const coverSrc = coverPreview || vendor?.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800';
  const logoSrc = logoPreview || vendor?.logo;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Instagram-style Header */}
        <div className="mb-6">
          <h1 className="font-poppins font-bold text-2xl text-brand-dark">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Instagram-style Profile Section */}
          <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Picture */}
              <div className="relative group">
                <div 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-orange-100 cursor-pointer bg-white shadow-lg"
                  onClick={() => logoRef.current?.click()}
                >
                  {logoSrc ? (
                    <img src={logoSrc} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                      <span className="text-white font-bold text-4xl">{vendor?.businessName?.[0]}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <div className="text-center">
                      <Camera size={24} className="text-white mx-auto mb-1" />
                      <p className="text-white text-xs font-medium">Change</p>
                    </div>
                  </div>
                </div>
                <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} className="hidden" />
              </div>

              {/* Business Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-brand-dark mb-2">{vendor?.businessName || 'Your Business'}</h2>
                <p className="text-sm text-brand-muted mb-4">{vendor?.address || 'Add your location'}</p>
                <div className="flex flex-wrap gap-8 justify-center sm:justify-start text-sm">
                  <div className="text-center">
                    <span className="font-bold text-brand-dark block text-lg">{vendor?.totalProducts || 0}</span>
                    <span className="text-brand-muted text-xs">Products</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-brand-dark block text-lg">{vendor?.totalOrders || 0}</span>
                    <span className="text-brand-muted text-xs">Orders</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-brand-dark block text-lg">{vendor?.followers || 0}</span>
                    <span className="text-brand-muted text-xs">Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6 space-y-4">
            <h3 className="font-semibold text-brand-dark mb-4">Business Information</h3>
            
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block">Business Name</label>
                <input 
                  type="text" 
                  name="businessName" 
                  value={form.businessName || ''} 
                  onChange={handleChange} 
                  placeholder="Your business name" 
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block">Bio / Description</label>
                <textarea 
                  name="description" 
                  value={form.description || ''} 
                  onChange={handleChange} 
                  rows={3} 
                  className="input-field resize-none" 
                  placeholder="Tell customers about your kitchen and specialties..."
                  maxLength={150}
                />
                <p className="text-xs text-brand-muted mt-1">{(form.description || '').length}/150</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={form.phone || ''} 
                    onChange={handleChange} 
                    placeholder="+234 800 000 0000" 
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">WhatsApp</label>
                  <input 
                    type="tel" 
                    name="whatsapp" 
                    value={form.whatsapp || ''} 
                    onChange={handleChange} 
                    placeholder="+234 800 000 0000" 
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block">Location / Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={form.address || ''} 
                  onChange={handleChange} 
                  placeholder="Yaba, Lagos" 
                  className="input-field"
                  required
                />
              </div>

              {/* Delivery Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🚚</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">Offer Delivery Service</p>
                    <p className="text-xs text-brand-muted">Enable delivery for your orders</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, offersDelivery: !p.offersDelivery }))}
                  className={`relative w-14 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${
                    form.offersDelivery ? 'bg-accent' : 'bg-gray-300'
                  }`}
                  aria-label="Toggle delivery"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', damping: 20, stiffness: 500 }}
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md ${
                      form.offersDelivery ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6 space-y-4">
            <h3 className="font-semibold text-brand-dark mb-4">Operating Hours</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block">Opening Time</label>
                <input 
                  type="time" 
                  name="openingTime" 
                  value={form.openingTime} 
                  onChange={handleChange} 
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block">Closing Time</label>
                <input 
                  type="time" 
                  name="closingTime" 
                  value={form.closingTime} 
                  onChange={handleChange} 
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-brand-dark mb-2 block">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button 
                    key={day} 
                    type="button" 
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedDays.includes(day) 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bank Details - Collapsed */}
          <details className="bg-white rounded-2xl shadow-card border border-orange-100 overflow-hidden group">
            <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-brand-dark">Bank Details (Optional)</h3>
                <span className="text-brand-muted text-sm group-open:rotate-180 transition-transform inline-block">▼</span>
              </div>
            </summary>
            <div className="px-6 pb-6 space-y-4 border-t border-orange-100">
              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block mt-4">Bank Name</label>
                <input 
                  type="text" 
                  name="bankName" 
                  value={form.bankName || ''} 
                  onChange={handleChange} 
                  placeholder="First Bank, GTBank..." 
                  className="input-field"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Account Number</label>
                  <input 
                    type="text" 
                    name="accountNumber" 
                    value={form.accountNumber || ''} 
                    onChange={handleChange} 
                    placeholder="0123456789" 
                    className="input-field"
                    maxLength="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Account Name</label>
                  <input 
                    type="text" 
                    name="accountName" 
                    value={form.accountName || ''} 
                    onChange={handleChange} 
                    placeholder="Account holder name" 
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Pickup Location - Collapsed */}
          <details className="bg-white rounded-2xl shadow-card border border-orange-100 overflow-hidden group">
            <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-brand-dark">Self-Pickup Location (Optional)</h3>
                  <p className="text-xs text-brand-muted mt-1">Allow customers to pick up orders</p>
                </div>
                <span className="text-brand-muted text-sm group-open:rotate-180 transition-transform inline-block">▼</span>
              </div>
            </summary>
            <div className="px-6 pb-6 space-y-4 border-t border-orange-100">
              {showLocationHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 space-y-2 mt-4">
                  <p className="font-semibold">How to get coordinates:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Open Google Maps</li>
                    <li>Right-click your location → "What's here?"</li>
                    <li>Copy coordinates (e.g., 6.5244, 3.3792)</li>
                  </ol>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowLocationHelp(!showLocationHelp)}
                className="text-xs text-primary font-medium hover:underline"
              >
                {showLocationHelp ? 'Hide Help' : 'Show Help'}
              </button>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Latitude</label>
                  <input 
                    type="number" 
                    step="any"
                    name="pickupLatitude" 
                    value={form.pickupLatitude || ''} 
                    onChange={handleChange} 
                    placeholder="6.5244" 
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Longitude</label>
                  <input 
                    type="number" 
                    step="any"
                    name="pickupLongitude" 
                    value={form.pickupLongitude || ''} 
                    onChange={handleChange} 
                    placeholder="3.3792" 
                    className="input-field" 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-dark mb-1.5 block">Pickup Instructions</label>
                <textarea 
                  name="pickupInstructions" 
                  value={form.pickupInstructions || ''} 
                  onChange={handleChange} 
                  rows={2} 
                  className="input-field resize-none" 
                  placeholder="e.g., Enter through side gate..."
                />
              </div>

              {form.pickupLatitude && form.pickupLongitude && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">✓</div>
                  <p className="text-xs text-green-700">Self-pickup enabled! Customers can pick up from your location.</p>
                </div>
              )}
            </div>
          </details>

          {/* Save Button */}
          <div className="sticky bottom-4 z-10">
            <motion.button 
              type="submit" 
              disabled={saving}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} /> 
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
