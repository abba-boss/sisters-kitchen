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
  const logoRef = useRef();
  const coverRef = useRef();

  useEffect(() => {
    vendorService.getMyProfile()
      .then(({ data }) => {
        const v = data.data;
        setVendor(v);
        setForm({ businessName: v.businessName || '', description: v.description || '', address: v.address || '', phone: v.phone || '', whatsapp: v.whatsapp || '', openingTime: v.openingTime || '', closingTime: v.closingTime || '', bankName: v.bankName || '', accountNumber: v.accountNumber || '', accountName: v.accountName || '' });
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
      <h1 className="font-poppins font-bold text-xl text-brand-dark mb-6">Store Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Cover & Logo */}
        <div className="card overflow-hidden">
          <div className="relative h-40 cursor-pointer group" onClick={() => coverRef.current?.click()}>
            <img src={coverSrc} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input ref={coverRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} className="hidden" />
          </div>
          <div className="p-4 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-card cursor-pointer group" onClick={() => logoRef.current?.click()}>
              {logoSrc ? <img src={logoSrc} alt="logo" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">{vendor?.businessName?.[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} className="text-white" />
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} className="hidden" />
            </div>
            <p className="text-sm text-brand-muted">Click images to change them</p>
          </div>
        </div>

        {/* Business Info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-brand-dark text-sm">Business Information</h2>
          {[
            { name: 'businessName', label: 'Business Name', placeholder: 'Mama Ngozi\'s Kitchen' },
            { name: 'phone', label: 'Phone Number', placeholder: '+234 ...' },
            { name: 'whatsapp', label: 'WhatsApp Number', placeholder: '+234 ...' },
            { name: 'address', label: 'Location/Address', placeholder: 'Yaba, Lagos' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="text-xs font-medium text-brand-dark mb-1 block">{label}</label>
              <input type="text" name={name} value={form[name] || ''} onChange={handleChange} placeholder={placeholder} className="input-field" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-brand-dark mb-1 block">Description</label>
            <textarea name="description" value={form.description || ''} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Tell customers about your kitchen..." />
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-brand-dark text-sm">Operating Hours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Opening Time</label>
              <input type="time" name="openingTime" value={form.openingTime} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-dark mb-1 block">Closing Time</label>
              <input type="time" name="closingTime" value={form.closingTime} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-brand-dark mb-2 block">Available Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedDays.includes(day) ? 'bg-primary text-white' : 'bg-brand-bg text-brand-muted hover:border-primary'
                  }`}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-brand-dark text-sm">Bank Details (for payouts)</h2>
          {[
            { name: 'bankName', label: 'Bank Name', placeholder: 'First Bank' },
            { name: 'accountNumber', label: 'Account Number', placeholder: '0123456789' },
            { name: 'accountName', label: 'Account Name', placeholder: 'Jane Doe' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="text-xs font-medium text-brand-dark mb-1 block">{label}</label>
              <input type="text" name={name} value={form[name] || ''} onChange={handleChange} placeholder={placeholder} className="input-field" />
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </DashboardLayout>
  );
}
