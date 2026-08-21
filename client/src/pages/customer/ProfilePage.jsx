import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Trash2, 
  User, 
  Save, 
  LogOut,
  Lock,
  KeyRound,
  Shield,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, updateUserProfile } from '../../redux/slices/auth.slice.js';
import { fetchMyAppointments } from '../../redux/slices/appointment.slice.js';
import { AppointmentStatus } from '../../utils/constants.js';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { myAppointments = [] } = useSelector((state) => state.appointment);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchMyAppointments());
  }, [dispatch]);

  const activeBookingsCount = myAppointments.filter(
    (a) =>
      a.status === AppointmentStatus.WAITING ||
      a.status === AppointmentStatus.IN_SERVICE ||
      a.status === AppointmentStatus.PENDING_APPROVAL
  ).length;

  const completedBookingsCount = myAppointments.filter(
    (a) => a.status === AppointmentStatus.COMPLETED
  ).length;

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (err) {
      console.error(err);
      navigate('/login');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BQ';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Error: Invalid file type. Only JPG, PNG and PDF are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      setSelectedFile(null);
      setPreviewUrl('');
      await dispatch(updateUserProfile({ avatar: '' })).unwrap();
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error(err || 'Failed to remove picture');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      toast.error('Phone must be 10 digits starting with 6, 7, 8, or 9');
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('email', formData.email.trim().toLowerCase());
      data.append('phone', formData.phone.trim());
      if (selectedFile) data.append('avatar', selectedFile);
      await dispatch(updateUserProfile(data)).unwrap();
      toast.success('Profile updated!');
      setSelectedFile(null);
    } catch (err) {
      toast.error(err || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans text-zinc-900 pb-24 md:pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <span className="text-xs font-semibold text-zinc-500">
            Account & Settings
          </span>
        </div>

        {/* Page Header Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar with Camera Overlay */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold text-xl overflow-hidden shadow-xs border border-zinc-200">
                {previewUrl || user?.avatar ? (
                  <img src={previewUrl || user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-zinc-900 leading-tight">
                  {user.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 uppercase tracking-wider">
                  Customer
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{user.email || user.phone}</p>
              
              {(previewUrl || user.avatar) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={saving}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 mt-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove picture</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
            <div className="px-3.5 py-2 bg-zinc-50 rounded-xl border border-zinc-100 text-center flex-1 sm:flex-initial">
              <p className="text-lg font-bold text-zinc-900 leading-none">{activeBookingsCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-1">Active Queue</p>
            </div>
            <div className="px-3.5 py-2 bg-zinc-50 rounded-xl border border-zinc-100 text-center flex-1 sm:flex-initial">
              <p className="text-lg font-bold text-zinc-900 leading-none">{completedBookingsCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-1">Completed</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Details</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (2 Cols) - Active Tab Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'profile' ? (
              /* Personal Information Card */
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 sm:p-6 space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span>Personal Information</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Your contact details used by barber salons for queue bookings
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Contact Phone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          placeholder="10-digit mobile number"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Security & Password Card */
              <ChangePasswordCard />
            )}

          </div>

          {/* Right Column (1 Col) - Quick Links & Account Actions */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Quick Navigation
              </h3>

              <div className="space-y-1.5">
                <button
                  onClick={() => navigate('/appointments')}
                  className="w-full p-2.5 rounded-xl hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors flex items-center justify-between border border-transparent hover:border-zinc-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                    <span>My Bookings & Queue</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full p-2.5 rounded-xl hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors flex items-center justify-between border border-transparent hover:border-zinc-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                    <span>Explore Barbershops</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Account Security & Sign Out Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Account Actions
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Logged in via secure JWT token session</span>
                </div>

                <div className="pt-2 border-t border-zinc-100">
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out from Account</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export const ChangePasswordCard = () => {
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passData.currentPassword || !passData.newPassword) {
      toast.error('Enter current & new password');
      return;
    }
    if (passData.newPassword.length < 6) {
      toast.error('Min 6 characters required');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success(res.data?.message || 'Password changed!');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 sm:p-6 space-y-5">
      <div className="border-b border-zinc-100 pb-3">
        <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-zinc-500" />
          <span>Security & Password</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Ensure your account is protected with a strong, secure password
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={passData.currentPassword}
              onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
              placeholder="Enter current password"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
