import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authService.updateProfile(profileForm);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <MainLayout>
      <div className="page-container py-10 max-w-2xl mx-auto">
        <h1 className="section-title mb-6">My Profile</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card mb-6 w-fit">
          {[['profile', 'Profile', User], ['password', 'Password', Lock]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleProfileSave} className="card p-6 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-4 border-b border-orange-50">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="font-poppins font-bold text-primary text-2xl">{user?.firstName?.[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-brand-dark">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-brand-muted capitalize">{user?.role} · {user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 block">First Name</label>
                <input value={profileForm.firstName} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Last Name</label>
                <input value={profileForm.lastName} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Phone</label>
              <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+234..." className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-dark mb-1.5 block">Default Delivery Address</label>
              <textarea value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} rows={2} className="input-field resize-none" placeholder="Your address..." />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} />{saving ? 'Saving…' : 'Save Profile'}
            </button>
          </motion.form>
        )}

        {tab === 'password' && (
          <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handlePasswordChange} className="card p-6 space-y-5">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 block">{label}</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={pwdForm[key]}
                    onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                    className="input-field pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Lock size={16} />{saving ? 'Updating…' : 'Change Password'}
            </button>
          </motion.form>
        )}
      </div>
    </MainLayout>
  );
}
