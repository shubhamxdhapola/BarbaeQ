import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchMyShop,
  updateShop,
  uploadShopPhotos,
  deleteShopPhoto,
} from "../../redux/slices/shop.slice.js";
import { updateUserProfile, logoutUser } from "../../redux/slices/auth.slice.js";
import axiosInstance from "../../utils/axiosInstance.js";
import { API_PATHS } from "../../utils/apiPaths.js";
import { Skeleton } from "../../components/ui/Skeleton";
import { DocumentModal } from "../../components/ui/DocumentModal";
import {
  FileText,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  AlertCircle,
  AlertTriangle,
  MapPin,
  Navigation,
  Upload,
  Trash2,
  ExternalLink,
  Plus,
  Camera,
  User,
  Save,
  Mail,
  Phone,
  Settings,
  Lock,
  Building2,
  Sparkles,
  CheckCircle2,
  Store,
  ChevronRight,
  Shield,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

const SETTINGS_SECTIONS = [
  {
    id: "general",
    label: "General Information",
    description: "Shop profile, address & hours",
    icon: Store,
  },
  {
    id: "photos",
    label: "Photos Gallery",
    description: "Ambience & storefront images",
    icon: ImageIcon,
  },
  {
    id: "owner",
    label: "Owner Profile",
    description: "Personal details & avatar",
    icon: User,
  },
  {
    id: "security",
    label: "Security & Password",
    description: "Account login credentials",
    icon: Lock,
  },
  {
    id: "verification",
    label: "Verification Documents",
    description: "Legal records & approval status",
    icon: ShieldCheck,
  },
];

export const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myShop: shop, loading } = useSelector((state) => state.shop);
  const { user } = useSelector((state) => state.auth);

  const [activeSection, setActiveSection] = useState("general");
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Owner profile states
  const [ownerData, setOwnerData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [ownerAvatarPreview, setOwnerAvatarPreview] = useState(
    user?.avatar || "",
  );
  const [selectedOwnerAvatar, setSelectedOwnerAvatar] = useState(null);
  const [savingOwnerProfile, setSavingOwnerProfile] = useState(false);
  const ownerFileInputRef = useRef(null);

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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    openingTime: "09:00 AM",
    closingTime: "09:00 PM",
    latitude: "",
    longitude: "",
    googleMapsUrl: "",
    landmark: "",
    pincode: "",
  });

  // Modal preview state for submitted docs / photos
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: "",
    title: "",
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
        name: shop.name || "",
        description: shop.description || "",
        phone: shop.phone || "",
        address: shop.address || "",
        city: shop.city || "",
        openingTime: shop.openingTime || "09:00 AM",
        closingTime: shop.closingTime || "09:00 PM",
        latitude:
          shop.latitude !== null && shop.latitude !== undefined
            ? shop.latitude
            : "",
        longitude:
          shop.longitude !== null && shop.longitude !== undefined
            ? shop.longitude
            : "",
        googleMapsUrl: shop.googleMapsUrl || "",
        landmark: shop.landmark || "",
        pincode: shop.pincode || "",
      });
    }
  }, [shop]);

  useEffect(() => {
    if (user) {
      setOwnerData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      if (user.avatar) {
        setOwnerAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  const isDeactivatedByAdmin = shop?.isActive === false;

  const handleToggleOpen = async () => {
    if (!shop) return;
    if (isDeactivatedByAdmin) {
      toast.error("Shop is deactivated");
      return;
    }
    try {
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      await dispatch(
        updateShop({ id: shop._id, data: { isOpen: nextOpen } }),
      ).unwrap();
      toast.success(`Shop is now ${nextOpen ? "Open" : "Closed"}`);
    } catch (err) {
      setIsOpen(!isOpen);
      toast.error("Status update failed");
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
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
        toast.success("GPS location captured!");
      },
      (err) => {
        setGettingLocation(false);
        console.error("GPS error", err);
        toast.error("Location access denied");
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

    const invalidFiles = files.filter(f => !f.type.startsWith("image/") || f.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("Error: Invalid file type. Only JPG, PNG and PDF are allowed.");
      e.target.value = '';
      return;
    }

    setSelectedFiles(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(previews);
  };

  const handleUploadPhotos = async () => {
    if (!selectedFiles.length) {
      toast.error("Please select photos");
      return;
    }
    try {
      setUploadingPhotos(true);
      const fd = new FormData();
      selectedFiles.forEach((file) => {
        fd.append("photos", file);
      });

      await dispatch(uploadShopPhotos(fd)).unwrap();
      toast.success("Photos uploaded!");
      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (err) {
      toast.error(err || "Upload failed");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    try {
      await dispatch(deleteShopPhoto(photoUrl)).unwrap();
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err || "Delete failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shop) return;
    if (isDeactivatedByAdmin) {
      toast.error("Shop is deactivated");
      return;
    }
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      toast.error("Phone must be 10 digits starting with 6, 7, 8, or 9");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...formData,
        latitude: formData.latitude !== "" ? Number(formData.latitude) : null,
        longitude:
          formData.longitude !== "" ? Number(formData.longitude) : null,
      };
      await dispatch(updateShop({ id: shop._id, data: payload })).unwrap();
      toast.success("Settings saved!");
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleOwnerAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Error: Invalid file type. Only JPG, PNG and PDF are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
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
      setOwnerAvatarPreview("");
      await dispatch(updateUserProfile({ avatar: "" })).unwrap();
      toast.success("Profile picture removed");
    } catch (err) {
      toast.error(err || "Remove failed");
    } finally {
      setSavingOwnerProfile(false);
    }
  };

  const handleSaveOwnerProfile = async (e) => {
    e.preventDefault();
    if (!ownerData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!ownerData.email.trim() || !/\S+@\S+\.\S+/.test(ownerData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(ownerData.phone.trim())) {
      toast.error("Phone must be 10 digits starting with 6, 7, 8, or 9");
      return;
    }

    try {
      setSavingOwnerProfile(true);
      const data = new FormData();
      data.append("name", ownerData.name.trim());
      data.append("email", ownerData.email.trim().toLowerCase());
      data.append("phone", ownerData.phone.trim());

      if (selectedOwnerAvatar) {
        data.append("avatar", selectedOwnerAvatar);
      }

      await dispatch(updateUserProfile(data)).unwrap();
      toast.success("Profile updated!");
      setSelectedOwnerAvatar(null);
    } catch (err) {
      toast.error(err || "Profile update failed");
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
      <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center font-bold text-muted max-w-6xl mx-auto">
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
    if (shop.status === "APPROVED") {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          VERIFIED & APPROVED
        </span>
      );
    }
    if (shop.status === "REJECTED") {
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

  const getDocStatusText = (docUrl) => {
    if (!docUrl) return "Not Uploaded";
    if (isDeactivatedByAdmin) return "Submitted (Deactivated)";
    if (shop.status === "APPROVED") return "Submitted & Verified ✓";
    if (shop.status === "REJECTED") return "Submitted (Rejected)";
    return "Submitted (Pending Review)";
  };

  const googleMapsSearchUrl =
    formData.latitude && formData.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          (formData.name || shop.name) +
            " " +
            formData.address +
            " " +
            formData.city,
        )}`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto">
      {isDeactivatedByAdmin && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 text-rose-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">
            Your shop has been{" "}
            <span className="font-extrabold uppercase">
              DEACTIVATED BY ADMIN
            </span>
            . Updating shop settings and taking live queues is currently
            disabled.
          </p>
        </div>
      )}

      {/* 1. Header with Live Shop Status Toggle */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Shop Settings
              </h2>
              {renderStatusBadge()}
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Configure shop profile, photos, owner security, and verification
              documents
            </p>
          </div>
        </div>

        {/* Simple, Minimal & Professional Shop Open/Closed Toggle */}
        <button
          type="button"
          onClick={handleToggleOpen}
          disabled={isDeactivatedByAdmin}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 hover:bg-white hover:border-zinc-300 transition-all cursor-pointer shadow-sm self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed group"
          title={
            isOpen
              ? "Click to close shop for bookings"
              : "Click to open shop for bookings"
          }
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                isOpen
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                  : "bg-zinc-400"
              }`}
            />
            <span className="text-xs font-bold text-zinc-900">
              {isOpen ? "Open for Bookings" : "Shop Closed"}
            </span>
          </div>

          {/* Minimal Switch Pill */}
          <div
            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
              isOpen ? "bg-zinc-900" : "bg-zinc-300"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                isOpen ? "translate-x-3.5" : "translate-x-0"
              }`}
            />
          </div>
        </button>
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
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-white/10 text-indigo-300"
                          : "bg-zinc-100 text-zinc-600 group-hover:bg-white group-hover:text-zinc-900 border border-zinc-200/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p
                        className={`font-bold text-xs sm:text-sm leading-snug ${isActive ? "text-white" : "text-zinc-900"}`}
                      >
                        {section.label}
                      </p>
                      <p
                        className={`text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 ${isActive ? "text-zinc-400" : "text-zinc-500"}`}
                      >
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {section.id === "photos" && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-zinc-200/70 text-zinc-700"
                        }`}
                      >
                        {photos.length}/5
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive
                          ? "text-white translate-x-0.5"
                          : "text-zinc-400 group-hover:translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Shop Summary Widget in Sidebar */}
          <div className="bg-white p-4 rounded-2xl shadow-card border border-zinc-200/80 space-y-1.5 hidden lg:block">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Active Shop
              </span>
              <span
                className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
              />
            </div>
            <p className="font-bold text-sm text-zinc-900 truncate">
              {shop.name}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {shop.address}, {shop.city}
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
          {/* SECTION 1: General Info & Business Hours & GPS */}
          {activeSection === "general" && (
            <form
              onSubmit={handleSave}
              className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in"
            >
              <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 tracking-tight">
                    Shop Basic Information & Timings
                  </h3>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    Shop address, contact details, operating hours & GPS
                    coordinates
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isDeactivatedByAdmin}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Shop Public Phone
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                    }
                    disabled={isDeactivatedByAdmin}
                    placeholder="10-digit shop phone"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                  Description / Tagline
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isDeactivatedByAdmin}
                  placeholder="Tell customers about your services, atmosphere and grooming expertise..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Full Street Address
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    disabled={isDeactivatedByAdmin}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    disabled={isDeactivatedByAdmin}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Landmark / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite City Mall, 2nd Floor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.landmark}
                    onChange={(e) =>
                      setFormData({ ...formData, landmark: e.target.value })
                    }
                    disabled={isDeactivatedByAdmin}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 452001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    disabled={isDeactivatedByAdmin}
                  />
                </div>
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Opening Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.openingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, openingTime: e.target.value })
                    }
                    disabled={isDeactivatedByAdmin}
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Closing Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.closingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, closingTime: e.target.value })
                    }
                    disabled={isDeactivatedByAdmin}
                    required
                  />
                </div>
              </div>

              {/* Store Location & Google Maps Section */}
              <div className="pt-5 border-t border-zinc-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      Store Location & GPS Coordinates
                    </h4>
                    <p className="text-xs text-muted font-medium mt-0.5">
                      Coordinates provide turn-by-turn navigation for customers
                      directly in Google Maps
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={gettingLocation || isDeactivatedByAdmin}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Navigation
                      className={`w-3.5 h-3.5 text-indigo-600 ${gettingLocation ? "animate-spin" : ""}`}
                    />
                    {gettingLocation
                      ? "Capturing GPS..."
                      : "📍 Use My Current Location"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                      Latitude (GPS)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 22.719568"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                      disabled={isDeactivatedByAdmin}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                      Longitude (GPS)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 75.857727"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                      disabled={isDeactivatedByAdmin}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Custom Google Maps Share Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://maps.app.goo.gl/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
                    value={formData.googleMapsUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        googleMapsUrl: e.target.value,
                      })
                    }
                    disabled={isDeactivatedByAdmin}
                  />
                </div>

                <div className="flex items-center justify-between bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-200/70 text-xs">
                  <span className="text-muted font-medium">
                    Verify Google Maps navigation link:
                  </span>
                  <a
                    href={formData.googleMapsUrl || googleMapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || isDeactivatedByAdmin}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving Changes..." : "Save General Info"}
                </button>
              </div>
            </form>
          )}

          {/* SECTION 2: Photos Gallery */}
          {activeSection === "photos" && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 tracking-tight">
                      Shop Photos Gallery ({photos.length}/5)
                    </h3>
                    <p className="text-xs text-muted font-medium mt-0.5">
                      Showcase high quality pictures of your chairs, styling
                      stations and exterior storefront
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-zinc-100 text-zinc-700 rounded-xl self-start sm:self-auto border border-zinc-200/60">
                  Max 5 Photos
                </span>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {photos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden border border-zinc-200/80 aspect-square bg-zinc-100 shadow-2xs"
                  >
                    <img
                      src={photoUrl}
                      alt={`Shop photo ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          url: photoUrl,
                          title: `Shop Photo ${idx + 1}`,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photoUrl)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl shadow-md transition-transform hover:scale-110 cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs ${
                          idx === 0
                            ? "bg-zinc-900 text-white border border-white/20"
                            : "bg-black/75 text-white backdrop-blur-xs"
                        }`}
                      >
                        {idx === 0 ? "★ Front Cover" : `#${idx + 1}`}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Empty Slots */}
                {Array.from({ length: Math.max(0, 5 - photos.length) }).map(
                  (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border-2 border-dashed border-zinc-200 rounded-2xl aspect-square flex flex-col items-center justify-center text-zinc-400 p-2 text-center bg-zinc-50/50"
                    >
                      <Plus className="w-5 h-5 mb-1 text-zinc-300" />
                      <span className="text-[11px] font-bold text-zinc-400">
                        Slot {photos.length + i + 1}
                      </span>
                    </div>
                  ),
                )}
              </div>

              {/* Upload Controls */}
              {photos.length < 5 && (
                <div className="bg-zinc-50/80 p-4 sm:p-5 rounded-2xl border border-zinc-200/70 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs cursor-pointer flex items-center justify-center gap-2 transition-all">
                      <Upload className="w-4 h-4 text-zinc-600" />
                      <span>Select Photos to Upload</span>
                      <input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isDeactivatedByAdmin || uploadingPhotos}
                      />
                    </label>

                    {selectedFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUploadPhotos}
                        disabled={uploadingPhotos}
                        className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-40"
                      >
                        {uploadingPhotos
                          ? "Uploading Photos..."
                          : `Upload ${selectedFiles.length} Photo(s)`}
                      </button>
                    )}
                  </div>

                  {/* Previews */}
                  {filePreviews.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Ready to Upload:
                      </p>
                      <div className="flex gap-2.5 flex-wrap">
                        {filePreviews.map((src, idx) => (
                          <div
                            key={idx}
                            className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-300 shadow-2xs"
                          >
                            <img
                              src={src}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: Owner Profile */}
          {activeSection === "owner" && (
            <form
              onSubmit={handleSaveOwnerProfile}
              className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in"
            >
              <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 tracking-tight">
                    Owner Account Profile
                  </h3>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    Personal display name, contact phone and profile picture
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar with Camera Trigger & Remove Below */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-zinc-100 border-2 border-zinc-200 overflow-hidden shadow-2xs flex items-center justify-center">
                      {ownerAvatarPreview || user?.avatar ? (
                        <img
                          src={ownerAvatarPreview || user?.avatar}
                          alt="Owner Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-zinc-800">
                          {user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase() || "SO"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => ownerFileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-md border-2 border-white transition-transform group-hover:scale-110 cursor-pointer"
                      title="Upload Profile Picture"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      ref={ownerFileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleOwnerAvatarChange}
                      className="hidden"
                    />
                  </div>

                  {/* Remove Capsule Button Below Avatar */}
                  {ownerAvatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveOwnerAvatar}
                      disabled={savingOwnerProfile}
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
                      Owner Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                      value={ownerData.name}
                      onChange={(e) =>
                        setOwnerData({ ...ownerData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                        Owner Contact Phone
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                        value={ownerData.phone}
                        onChange={(e) =>
                          setOwnerData({ ...ownerData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                        }
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                        Owner Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                        value={ownerData.email}
                        onChange={(e) =>
                          setOwnerData({ ...ownerData, email: e.target.value })
                        }
                        placeholder="owner@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingOwnerProfile}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <Save className="w-4 h-4" />
                  {savingOwnerProfile ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </form>
          )}

          {/* SECTION 4: Security & Password */}
          {activeSection === "security" && (
            <div className="animate-fade-in">
              <OwnerChangePasswordCard />
            </div>
          )}

          {/* SECTION 5: Verification Documents */}
          {activeSection === "verification" && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 tracking-tight">
                      Submitted Verification Documents
                    </h3>
                    <p className="text-xs text-muted font-medium mt-0.5">
                      Government registration documents and ID verification
                      records
                    </p>
                  </div>
                </div>
                {renderStatusBadge()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Establishment Cert */}
                <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      1. Establishment Cert
                    </p>
                    <p
                      className={`text-xs font-bold mt-1 ${docs.establishmentCert ? (shop.status === "APPROVED" && !isDeactivatedByAdmin ? "text-emerald-700" : "text-rose-700") : "text-zinc-400"}`}
                    >
                      {getDocStatusText(docs.establishmentCert)}
                    </p>
                  </div>
                  {docs.establishmentCert && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          url: docs.establishmentCert,
                          title: "Establishment Certificate",
                        })
                      }
                      className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-600" /> View
                      Document
                    </button>
                  )}
                </div>

                {/* Address Proof */}
                <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      2. Address Proof
                    </p>
                    <p
                      className={`text-xs font-bold mt-1 ${docs.addressProof ? (shop.status === "APPROVED" && !isDeactivatedByAdmin ? "text-emerald-700" : "text-rose-700") : "text-zinc-400"}`}
                    >
                      {getDocStatusText(docs.addressProof)}
                    </p>
                  </div>
                  {docs.addressProof && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          url: docs.addressProof,
                          title: "Address Proof",
                        })
                      }
                      className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-600" /> View
                      Document
                    </button>
                  )}
                </div>

                {/* Shop Front Photo */}
                <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      3. Registration Photo
                    </p>
                    <p
                      className={`text-xs font-bold mt-1 ${docs.shopPhoto ? (shop.status === "APPROVED" && !isDeactivatedByAdmin ? "text-emerald-700" : "text-rose-700") : "text-zinc-400"}`}
                    >
                      {getDocStatusText(docs.shopPhoto)}
                    </p>
                  </div>
                  {docs.shopPhoto && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          url: docs.shopPhoto,
                          title: "Shop Front Photo",
                        })
                      }
                      className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-600" /> View
                      Photo
                    </button>
                  )}
                </div>

                {/* GSTIN / Shop Proof */}
                <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      4. GSTIN / Tax Record
                    </p>
                    <p
                      className={`text-xs font-bold mt-1 ${docs.gstin ? (shop.status === "APPROVED" && !isDeactivatedByAdmin ? "text-emerald-700" : "text-rose-700") : "text-zinc-400"}`}
                    >
                      {docs.gstin
                        ? getDocStatusText(docs.gstin)
                        : "Not Provided"}
                    </p>
                  </div>
                  {docs.gstin && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          url: docs.gstin,
                          title: "GSTIN Document",
                        })
                      }
                      className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-zinc-600" /> View
                      Record
                    </button>
                  )}
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

      {/* Lightbox Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, url: "", title: "" })}
        url={previewModal.url}
        title={previewModal.title}
      />
    </div>
  );
};

export const OwnerChangePasswordCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passData.currentPassword || !passData.newPassword) {
      toast.error("Enter current & new password");
      return;
    }

    if (passData.newPassword.length < 6) {
      toast.error("Min 6 characters required");
      return;
    }

    if (passData.newPassword !== passData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success(res.data.message || "Password changed!");
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Password update failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white rounded-3xl shadow-card border border-zinc-200/80 p-5 sm:p-7 flex flex-col justify-between space-y-6"
      >
        <div className="space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Security & Password
              </h3>
              <p className="text-xs text-muted font-medium mt-0.5">
                Ensure your shop owner management account is secured
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passData.currentPassword}
              onChange={(e) =>
                setPassData({ ...passData, currentPassword: e.target.value })
              }
              placeholder="Enter current password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passData.newPassword}
                onChange={(e) =>
                  setPassData({ ...passData, newPassword: e.target.value })
                }
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passData.confirmPassword}
                onChange={(e) =>
                  setPassData({ ...passData, confirmPassword: e.target.value })
                }
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
};
