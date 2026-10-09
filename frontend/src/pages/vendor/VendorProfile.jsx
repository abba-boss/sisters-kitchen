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
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-poppins font-bold text-2xl text-brand-dark mb-2">Store Profile</h1>
          <p className="text-sm text-brand-muted">Manage your shop information, schedule, and settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover & Logo */}
          <div className="bg-white rounded-3xl shadow-card border border-orange-100 overflow-hidden">
            <div className="relative h-48 cursor-pointer group" onClick={() => coverRef.current?.click()}>
              <img src={coverSrc} alt="cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={32} className="text-white mb-2" />
                <span className="text-white text-sm font-semibold">Change Cover Photo</span>
              </div>
              <input ref={coverRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} className="hidden" />
            </div>
            <div className="p-6 flex items-center gap-5 relative -mt-12">
              <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg cursor-pointer group bg-white" onClick={() => logoRef.current?.click()}>
                {logoSrc ? (
                  <img src={logoSrc} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">{vendor?.businessName?.[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} className="hidden" />
              </div>
              <div>
                <p className="font-semibold text-brand-dark text-lg">{vendor?.businessName || 'Your Business'}</p>
                <p className="text-sm text-brand-muted">Click images to update them</p>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white rounded-3xl shadow-card border border-orange-100 p-6 space-y-5">
            <div>
              <h2 className="font-poppins font-bold text-lg text-brand-dark mb-1">Business Information</h2>
              <p className="text-xs text-brand-muted">Details that customers will see</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Business Name *</label>
                <input 
                  type="text" 
                  name="businessName" 
                  value={form.businessName || ''} 
                  onChange={handleChange} 
                  placeholder="Mama Ngozi's Kitchen" 
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Phone Number *</label>
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
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">WhatsApp Number</label>
                <input 
                  type="tel" 
                  name="whatsapp" 
                  value={form.whatsapp || ''} 
                  onChange={handleChange} 
                  placeholder="+234 800 000 0000" 
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Location/Address *</label>
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
            </div>

            <div>
              <label className="text-sm font-semibold text-brand-dark mb-2 block">Description</label>
              <textarea 
                name="description" 
                value={form.description || ''} 
                onChange={handleChange} 
                rows={4} 
                className="input-field resize-none" 
                placeholder="Tell customers about your kitchen, specialties, and what makes your food special..."
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-3xl shadow-card border border-orange-100 p-6 space-y-5">
            <div>
              <h2 className="font-poppins font-bold text-lg text-brand-dark mb-1">Operating Hours</h2>
              <p className="text-xs text-brand-muted">Set your availability for orders</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Opening Time</label>
                <input 
                  type="time" 
                  name="openingTime" 
                  value={form.openingTime} 
                  onChange={handleChange} 
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Closing Time</label>
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
              <label className="text-sm font-semibold text-brand-dark mb-3 block">Available Days</label>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((day) => (
                  <button 
                    key={day} 
                    type="button" 
                    onClick={() => toggleDay(day)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      selectedDays.includes(day) 
                        ? 'bg-primary text-white shadow-soft' 
                        : 'bg-brand-bg text-brand-muted border-2 border-transparent hover:border-primary/30'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-3xl shadow-card border border-orange-100 p-6 space-y-5">
            <div>
              <h2 className="font-poppins font-bold text-lg text-brand-dark mb-1">Bank Details</h2>
              <p className="text-xs text-brand-muted">For receiving your earnings and payouts</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Bank Name</label>
                <input 
                  type="text" 
                  name="bankName" 
                  value={form.bankName || ''} 
                  onChange={handleChange} 
                  placeholder="First Bank, GTBank, Access Bank..." 
                  className="input-field"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-brand-dark mb-2 block">Account Number</label>
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
                  <label className="text-sm font-semibold text-brand-dark mb-2 block">Account Name</label>
                  <input 
                    type="text" 
                    name="accountName" 
                    value={form.accountName || ''} 
                    onChange={handleChange} 
                    placeholder="Jane Doe" 
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="bg-white rounded-3xl shadow-card border border-orange-100 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-poppins font-bold text-lg text-brand-dark mb-1">Self-Pickup Location</h2>
                <p className="text-xs text-brand-muted">Let customers pick up orders from your location (Optional)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationHelp(!showLocationHelp)}
                className="text-xs text-primary font-semibold hover:underline whitespace-nowrap"
              >
                {showLocationHelp ? 'Hide Help' : 'Need Help?'}
              </button>
            </div>
            
            {showLocationHelp && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-sm text-blue-900 space-y-2">
                <p className="font-semibold">How to get your coordinates:</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>Open Google Maps on your computer or phone</li>
                  <li>Find and click on your exact location</li>
                  <li>Right-click (or long-press on mobile) → "What's here?"</li>
                  <li>Copy the coordinates (e.g., 6.5244, 3.3792)</li>
                  <li>First number = Latitude, Second number = Longitude</li>
                </ol>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Latitude</label>
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
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Longitude</label>
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
              <label className="text-sm font-semibold text-brand-dark mb-2 block">Pickup Instructions</label>
              <textarea 
                name="pickupInstructions" 
                value={form.pickupInstructions || ''} 
                onChange={handleChange} 
                rows={3} 
                className="input-field resize-none" 
                placeholder="e.g., Enter through the side gate, look for the red door on the second floor..."
              />
            </div>

            {form.pickupLatitude && form.pickupLongitude && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-1">Self-Pickup Enabled!</p>
                  <p className="text-xs text-green-700">
                    Customers can now choose to pick up orders from your location. They'll see a map and receive a QR code for verification.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="sticky bottom-4 z-10">
            <motion.button 
              type="submit" 
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} /> 
              {saving ? 'Saving Changes...' : 'Save Profile'}
            </motion.button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
