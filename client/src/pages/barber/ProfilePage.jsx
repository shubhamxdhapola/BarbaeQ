import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Save, 
  Camera, 
  Trash2, 
  Shield, 
  CheckCircle2,
  Scissors,
  Lock,
  Settings,
  ChevronRight,
  Store,
  Sparkles,
  Clock,
  Star,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';
import { updateUserProfile, logoutUser } from '../../redux/slices/auth.slice.js';
import { fetchMyBarberProfile } from '../../redux/slices/barber.slice.js';

const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    label: 'Barber Profile',
    description: 'Personal details & photo',
    icon: User,
  },
  {
    id: 'security',
    label: 'Security & Password',
    description: 'Account login credentials',
    icon: Lock,
  },
  {
    id: 'station',
    label: 'Station & Shop Info',
    description: 'Shop affiliation & status',
    icon: Scissors,
  },
];

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myProfile } = useSelector((state) => state.barber);
  
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Change Password State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    dispatch(fetchMyBarberProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
      if (user.avatar) {
        setPreviewUrl(user.avatar);
      }
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'B';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Error: Invalid file type. Only JPG, PNG and PDF are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      await dispatch(updateUserProfile({ avatar: '' })).unwrap();
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success('Avatar removed');
    } catch (err) {
      toast.error('Remove failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let avatarUrl = user?.avatar || '';

      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append('avatar', selectedFile);
        
        const uploadRes = await axiosInstance.post(API_PATHS.AUTH.UPLOAD_AVATAR, uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.data?.avatarUrl) {
          avatarUrl = uploadRes.data.data.avatarUrl;
        }
      }

      await dispatch(updateUserProfile({
        name: formData.name.trim(),
        ...(avatarUrl && { avatar: avatarUrl })
      })).unwrap();

      toast.success('Profile updated!');
      setSelectedFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

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
      setUpdatingPass(true);
      const res = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success(res.data.message || 'Password changed!');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Password update failed');
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">Barber Profile & Settings</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
                Specialist Staff
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Manage your personal specialist profile, avatar, and security credentials
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Sticky Left Nav + Right Active Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-3.5 lg:sticky lg:top-20">
          <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-card border border-zinc-200/80 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Settings Menu
            </div>

            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer group ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/10 text-indigo-300'
                          : 'bg-zinc-100 text-zinc-600 group-hover:bg-white group-hover:text-zinc-900 border border-zinc-200/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-bold text-xs sm:text-sm leading-snug ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                        {section.label}
                      </p>
                      <p className={`text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform shrink-0 ml-2 ${
                      isActive
                        ? 'text-white translate-x-0.5'
                        : 'text-zinc-400 group-hover:translate-x-0.5'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Specialist Status Widget in Sidebar */}
          <div className="bg-white p-4 rounded-2xl shadow-card border border-zinc-200/80 space-y-1.5 hidden lg:block">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Station Status
              </span>
              <span className={`w-2 h-2 rounded-full ${myProfile?.isAvailable !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>
            <p className="font-bold text-sm text-zinc-900 truncate">
              {user?.name || 'Barber Specialist'}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {myProfile?.shopId?.name || 'Assigned Barbershop'}
            </p>
          </div>

          {/* Logout Button Card in Sidebar (Desktop) */}
          <div className="hidden lg:block bg-white p-3 sm:p-4 rounded-3xl shadow-card border border-zinc-200/80">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer group hover:bg-rose-50 border border-transparent hover:border-rose-200/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-600 group-hover:bg-rose-100 border border-rose-200/60 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm leading-snug text-zinc-900 group-hover:text-rose-700 transition-colors">
                    Logout Account
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 text-zinc-400 group-hover:text-rose-500 transition-colors">
                    End active session
                  </p>
                </div>
              </div>
              <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Right Active Content Panel (8 cols) */}
        <div className="lg:col-span-8">
          {/* SECTION 1: Barber Profile */}
          {activeSection === 'profile' && (
            <form
              onSubmit={handleSubmitProfile}
              className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in"
            >
              <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 tracking-tight">
                    Barber Account Profile
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    Personal display name, contact phone and profile picture
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar with Camera Trigger & Remove Below */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-100 border-2 border-zinc-200 overflow-hidden shadow-2xs flex items-center justify-center">
                      {previewUrl || user?.avatar ? (
                        <img
                          src={previewUrl || user.avatar}
                          alt={user?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-zinc-800">
                          {getInitials(user?.name)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-md border-2 border-white transition-transform group-hover:scale-110 cursor-pointer"
                      title="Upload Profile Picture"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Remove Capsule Button Below Avatar */}
                  {(previewUrl || user?.avatar) && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={saving}
                      className="mt-2.5 px-3 py-1 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      title="Remove Profile Picture"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Input Fields */}
                <div className="flex-1 w-full space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                      Barber Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Full Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                      Barber Contact Phone (Non-editable)
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100/70 text-xs sm:text-sm font-medium text-zinc-500 cursor-not-allowed"
                      value={user?.phone || ''}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Additional Account & Specialist Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Login Email Address (Non-editable)
                  </label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100/70 text-xs sm:text-sm font-medium text-zinc-500 cursor-not-allowed"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Role & Verification
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">Verified Barber Specialist</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Assigned Barbershop
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                    <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                      {myProfile?.shopId?.name || 'Assigned Barbershop'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Station Rating
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                    <Star className={`w-4 h-4 shrink-0 ${myProfile?.reviewCount > 0 && myProfile?.averageRating > 0 ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'}`} />
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                      {myProfile?.reviewCount > 0 && myProfile?.averageRating > 0
                        ? `${myProfile.averageRating.toFixed(1)} / 5.0 (${myProfile.reviewCount} ${myProfile.reviewCount === 1 ? 'Review' : 'Reviews'})`
                        : 'No ratings yet (0 Reviews)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </form>
          )}

          {/* SECTION 2: Security & Password */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <form
                onSubmit={handlePasswordSubmit}
                className="bg-white p-4 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-5 sm:space-y-6"
              >
                <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                      Security & Password
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">
                      Update your account login credentials with a strong password
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 sm:space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                      value={passData.currentPassword}
                      onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                        value={passData.newPassword}
                        onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                        value={passData.confirmPassword}
                        onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingPass}
                    className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updatingPass ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 3: Station & Shop Affiliation */}
          {activeSection === 'station' && (
            <div className="bg-white p-4 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-5 sm:space-y-6 animate-fade-in">
              <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                    Station & Shop Affiliation
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">
                    Your assigned barbershop salon and public specialty profile
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-1">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Assigned Shop</p>
                  <p className="font-bold text-sm text-zinc-900">
                    {myProfile?.shopId?.name || 'Active Partner Barbershop'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {myProfile?.shopId?.address || 'Shop Location'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-1">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Station Rating</p>
                  <p className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                    <Star className={`w-4 h-4 shrink-0 ${myProfile?.reviewCount > 0 && myProfile?.averageRating > 0 ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'}`} />
                    <span>
                      {myProfile?.reviewCount > 0 && myProfile?.averageRating > 0
                        ? `${myProfile.averageRating.toFixed(1)} / 5.0`
                        : 'No ratings yet'}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {myProfile?.reviewCount > 0
                      ? `Based on ${myProfile.reviewCount} customer ${myProfile.reviewCount === 1 ? 'review' : 'reviews'}`
                      : 'No customer reviews recorded yet'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Logout Button Card (Below all cards on phone screens) */}
      <div className="block lg:hidden bg-white p-3 sm:p-4 rounded-3xl shadow-card border border-zinc-200/80">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer group hover:bg-rose-50 border border-transparent hover:border-rose-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-600 group-hover:bg-rose-100 border border-rose-200/60 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm leading-snug text-zinc-900 group-hover:text-rose-700 transition-colors">
                Logout Account
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 text-zinc-400 group-hover:text-rose-500 transition-colors">
                End active session
              </p>
            </div>
          </div>
          <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
