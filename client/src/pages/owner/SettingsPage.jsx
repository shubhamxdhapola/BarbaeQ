import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyShop,
  updateShop,
  uploadShopPhotos,
  deleteShopPhoto,
} from '../../redux/slices/shop.slice.js';
import { updateUserProfile, logoutUser } from '../../redux/slices/auth.slice.js';
import { Skeleton } from '../../components/ui/Skeleton';
import { DocumentModal } from '../../components/ui/DocumentModal';
import {
  Store,
  Image as ImageIcon,
  User,
  Lock,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ShopGeneralSettings } from '../../components/owner/settings/ShopGeneralSettings';
import { ShopPhotosSettings } from '../../components/owner/settings/ShopPhotosSettings';
import { OwnerProfileSettings } from '../../components/owner/settings/OwnerProfileSettings';
import { SecuritySettings } from '../../components/owner/settings/SecuritySettings';
import { ShopVerificationSettings } from '../../components/owner/settings/ShopVerificationSettings';

const SETTINGS_SECTIONS = [
  {
    id: 'general',
    label: 'General Information',
    description: 'Shop profile, address & hours',
    icon: Store,
  },
  {
    id: 'photos',
    label: 'Photos Gallery',
    description: 'Ambience & storefront images',
    icon: ImageIcon,
  },
  {
    id: 'owner',
    label: 'Owner Profile',
    description: 'Personal details & avatar',
    icon: User,
  },
  {
    id: 'security',
    label: 'Security & Password',
    description: 'Account login credentials',
    icon: Lock,
  },
  {
    id: 'verification',
    label: 'Verification Documents',
    description: 'Legal records & approval status',
    icon: ShieldCheck,
  },
];

export const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myShop: shop, loading } = useSelector((state) => state.shop);
  const { user } = useSelector((state) => state.auth);

  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Owner profile states
  const [ownerData, setOwnerData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [ownerAvatarPreview, setOwnerAvatarPreview] = useState(user?.avatar || '');
  const [selectedOwnerAvatar, setSelectedOwnerAvatar] = useState(null);
  const [savingOwnerProfile, setSavingOwnerProfile] = useState(false);
  const ownerFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    openingTime: '09:00 AM',
    closingTime: '09:00 PM',
    latitude: '',
    longitude: '',
    googleMapsUrl: '',
    landmark: '',
    pincode: '',
  });

  // Modal preview state for submitted docs / photos
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: '',
    title: '',
  });

  useEffect(() => {
    if (!shop) {
      dispatch(fetchMyShop());
    }
  }, [dispatch, shop]);

  useEffect(() => {
    if (shop) {
      setIsOpen(shop.isOpen);
      setFormData({
        name: shop.name || '',
        description: shop.description || '',
        phone: shop.phone || '',
        address: shop.address || '',
        city: shop.city || '',
        openingTime: shop.openingTime || '09:00 AM',
        closingTime: shop.closingTime || '09:00 PM',
        latitude: shop.latitude !== null && shop.latitude !== undefined ? shop.latitude : '',
        longitude: shop.longitude !== null && shop.longitude !== undefined ? shop.longitude : '',
        googleMapsUrl: shop.googleMapsUrl || '',
        landmark: shop.landmark || '',
        pincode: shop.pincode || '',
      });
    }
  }, [shop]);

  useEffect(() => {
    if (user) {
      setOwnerData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
      if (user.avatar) {
        setOwnerAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  const isDeactivatedByAdmin = shop?.isActive === false;

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

  const handleToggleOpen = async () => {
    if (!shop) return;
    if (isDeactivatedByAdmin) {
      toast.error('Shop is deactivated');
      return;
    }
    try {
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      await dispatch(updateShop({ id: shop._id, data: { isOpen: nextOpen } })).unwrap();
      toast.success(`Shop is now ${nextOpen ? 'Open' : 'Closed'}`);
    } catch (err) {
      setIsOpen(!isOpen);
      toast.error('Status update failed');
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setGettingLocation(false);
        toast.success('GPS location captured!');
      },
      (err) => {
        setGettingLocation(false);
        console.error('GPS error', err);
        toast.error('Location access denied');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentPhotoCount = (shop?.photos || []).length;
    if (currentPhotoCount + files.length > 5) {
      toast.error(`Max 5 photos allowed (have ${currentPhotoCount})`);
      e.target.value = '';
      return;
    }

    const invalidFiles = files.filter((f) => !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Error: Invalid file type. Only JPG, PNG and PDF are allowed.');
      e.target.value = '';
      return;
    }

    setSelectedFiles(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(previews);
  };

  const handleUploadPhotos = async () => {
    if (!selectedFiles.length) {
      toast.error('Please select photos');
      return;
    }
    try {
      setUploadingPhotos(true);
      const fd = new FormData();
      selectedFiles.forEach((file) => {
        fd.append('photos', file);
      });

      await dispatch(uploadShopPhotos(fd)).unwrap();
      toast.success('Photos uploaded!');
      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (err) {
      toast.error(err || 'Upload failed');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    try {
      await dispatch(deleteShopPhoto(photoUrl)).unwrap();
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err || 'Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shop) return;
    if (isDeactivatedByAdmin) {
      toast.error('Shop is deactivated');
      return;
    }
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      toast.error('Phone must be 10 digits starting with 6, 7, 8, or 9');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...formData,
        latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
      };
      await dispatch(updateShop({ id: shop._id, data: payload })).unwrap();
      toast.success('Settings saved!');
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleOwnerAvatarChange = (e) => {
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

    setSelectedOwnerAvatar(file);
    const objectUrl = URL.createObjectURL(file);
    setOwnerAvatarPreview(objectUrl);
  };

  const handleRemoveOwnerAvatar = async () => {
    try {
      setSavingOwnerProfile(true);
      setSelectedOwnerAvatar(null);
      setOwnerAvatarPreview('');
      await dispatch(updateUserProfile({ avatar: '' })).unwrap();
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error(err || 'Remove failed');
    } finally {
      setSavingOwnerProfile(false);
    }
  };

  const handleSaveOwnerProfile = async (e) => {
    e.preventDefault();
    if (!ownerData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!ownerData.email.trim() || !/\S+@\S+\.\S+/.test(ownerData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(ownerData.phone.trim())) {
      toast.error('Phone must be 10 digits starting with 6, 7, 8, or 9');
      return;
    }

    try {
      setSavingOwnerProfile(true);
      const data = new FormData();
      data.append('name', ownerData.name.trim());
      data.append('email', ownerData.email.trim().toLowerCase());
      data.append('phone', ownerData.phone.trim());

      if (selectedOwnerAvatar) {
        data.append('avatar', selectedOwnerAvatar);
      }

      await dispatch(updateUserProfile(data)).unwrap();
      toast.success('Profile updated!');
      setSelectedOwnerAvatar(null);
    } catch (err) {
      toast.error(err || 'Profile update failed');
    } finally {
      setSavingOwnerProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-96 rounded-3xl" />
          <Skeleton className="lg:col-span-8 h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center font-bold text-zinc-500 max-w-6xl mx-auto">
        No shop registered yet
      </div>
    );
  }

  const docs = shop.documents || {};
  const photos =
    shop.photos && shop.photos.length > 0
      ? shop.photos
      : docs.shopPhoto
      ? [docs.shopPhoto]
      : [];

  const renderStatusBadge = () => {
    if (isDeactivatedByAdmin) {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          DEACTIVATED BY ADMIN
        </span>
      );
    }
    if (shop.status === 'APPROVED') {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          VERIFIED & APPROVED
        </span>
      );
    }
    if (shop.status === 'REJECTED') {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          REJECTED
        </span>
      );
    }
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200/70">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        PENDING APPROVAL
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto">
      {isDeactivatedByAdmin && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 text-rose-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">
            Your shop has been <span className="font-extrabold uppercase">DEACTIVATED BY ADMIN</span>. Updating shop settings and taking live queues is currently disabled.
          </p>
        </div>
      )}

      {/* 1. Header with Live Shop Status Toggle */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Shop Settings</h2>
              {renderStatusBadge()}
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Configure shop profile, photos, owner security, and verification documents
            </p>
          </div>
        </div>

        {/* Minimal Switch */}
        <button
          type="button"
          onClick={handleToggleOpen}
          disabled={isDeactivatedByAdmin}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 hover:bg-white hover:border-zinc-300 transition-all cursor-pointer shadow-sm self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed group"
          title={isOpen ? 'Click to close shop for bookings' : 'Click to open shop for bookings'}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-zinc-400'
              }`}
            />
            <span className="text-xs font-bold text-zinc-900">
              {isOpen ? 'Open for Bookings' : 'Shop Closed'}
            </span>
          </div>

          <div
            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
              isOpen ? 'bg-zinc-900' : 'bg-zinc-300'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                isOpen ? 'translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </div>
        </button>
      </div>

      {/* 2. Main Two-Column Layout */}
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
                    isActive ? 'bg-zinc-900 text-white shadow-sm' : 'hover:bg-zinc-100 text-zinc-700'
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

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {section.id === 'photos' && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-zinc-200/70 text-zinc-700'
                        }`}
                      >
                        {photos.length}/5
                      </span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-white translate-x-0.5' : 'text-zinc-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop Logout Button */}
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
          {activeSection === 'general' && (
            <ShopGeneralSettings
              formData={formData}
              setFormData={setFormData}
              handleSave={handleSave}
              saving={saving}
              isDeactivatedByAdmin={isDeactivatedByAdmin}
              handleDetectLocation={handleDetectLocation}
              gettingLocation={gettingLocation}
              shop={shop}
            />
          )}

          {activeSection === 'photos' && (
            <ShopPhotosSettings
              photos={photos}
              setPreviewModal={setPreviewModal}
              handleDeletePhoto={handleDeletePhoto}
              handleFileChange={handleFileChange}
              handleUploadPhotos={handleUploadPhotos}
              uploadingPhotos={uploadingPhotos}
              selectedFiles={selectedFiles}
              filePreviews={filePreviews}
              isDeactivatedByAdmin={isDeactivatedByAdmin}
            />
          )}

          {activeSection === 'owner' && (
            <OwnerProfileSettings
              ownerData={ownerData}
              setOwnerData={setOwnerData}
              ownerAvatarPreview={ownerAvatarPreview}
              user={user}
              ownerFileInputRef={ownerFileInputRef}
              handleOwnerAvatarChange={handleOwnerAvatarChange}
              handleRemoveOwnerAvatar={handleRemoveOwnerAvatar}
              savingOwnerProfile={savingOwnerProfile}
              handleSaveOwnerProfile={handleSaveOwnerProfile}
            />
          )}

          {activeSection === 'security' && <SecuritySettings />}

          {activeSection === 'verification' && (
            <ShopVerificationSettings
              shop={shop}
              isDeactivatedByAdmin={isDeactivatedByAdmin}
              renderStatusBadge={renderStatusBadge}
              setPreviewModal={setPreviewModal}
            />
          )}
        </div>
      </div>

      {/* Mobile Logout Button Card */}
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

      {/* Document/Photo Lightbox Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, url: '', title: '' })}
        url={previewModal.url}
        title={previewModal.title}
      />
    </div>
  );
};
