import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Trash2,
  Save,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  ChevronRight,
  Shield,
  AlertCircle,
  KeyRound,
  Fingerprint,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance.js";
import { API_PATHS } from "../../utils/apiPaths.js";
import { updateUserProfile, logoutUser } from "../../redux/slices/auth.slice.js";
import { UserRole } from "../../utils/constants.js";

const getSettingsSections = (role) => [
  {
    id: "profile",
    label: role === UserRole.MANAGER ? "Manager Profile" : "Admin Profile",
    description: "Name, contact number & avatar",
    icon: User,
  },
  {
    id: "security",
    label: "Security & Password",
    description: "Account login credentials",
    icon: Lock,
  },
  {
    id: "system",
    label: "Role & Privileges",
    description: "Platform authorization details",
    icon: ShieldCheck,
  },
];

export const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeSection, setActiveSection] = useState("profile");
  const settingsSections = getSettingsSections(user?.role);

  // Profile form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Password change state
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
      if (user.avatar) {
        setPreviewUrl(user.avatar);
      }
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Error: Invalid file type. Only JPG, PNG and PDF are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = async () => {
    try {
      setSavingProfile(true);
      await dispatch(updateUserProfile({ avatar: "" })).unwrap();
      setSelectedFile(null);
      setPreviewUrl("");
      toast.success("Profile avatar removed successfully");
    } catch (err) {
      toast.error(err || "Failed to remove avatar");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    const isManager = user?.role === UserRole.MANAGER;
    if (!isManager && !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      toast.error("Phone must be 10 digits starting with 6, 7, 8, or 9");
      return;
    }

    setSavingProfile(true);
    try {
      let avatarUrl = user?.avatar || "";

      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append("avatar", selectedFile);

        const uploadRes = await axiosInstance.post(
          API_PATHS.AUTH.UPLOAD_AVATAR,
          uploadForm,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (uploadRes.data?.data?.avatarUrl) {
          avatarUrl = uploadRes.data.data.avatarUrl;
        }
      }

      await dispatch(
        updateUserProfile({
          name: formData.name.trim(),
          ...(!isManager && { phone: formData.phone.trim() }),
          ...(avatarUrl && { avatar: avatarUrl }),
        })
      ).unwrap();

      toast.success("Profile updated!");
      setSelectedFile(null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Profile update failed"
      );
    } finally {
      setSavingProfile(false);
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
      setUpdatingPass(true);
      const res = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success(res.data?.message || "Password changed!");
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Password update failed"
      );
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
      toast.success("Logged out");
    } catch (error) {
      navigate("/login");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {user?.role === UserRole.MANAGER ? "Manager" : "Admin"} Settings
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                {user?.role || "ADMIN"} PORTAL
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              {user?.role === UserRole.MANAGER
                ? "Configure manager profile, security credentials, and access permissions"
                : "Configure administrator profile, security credentials, and access permissions"}
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

            {settingsSections.map((section) => {
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
                        className={`font-bold text-xs sm:text-sm leading-snug ${
                          isActive ? "text-white" : "text-zinc-900"
                        }`}
                      >
                        {section.label}
                      </p>
                      <p
                        className={`text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 ${
                          isActive ? "text-zinc-400" : "text-zinc-500"
                        }`}
                      >
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform shrink-0 ml-2 ${
                      isActive
                        ? "text-white translate-x-0.5"
                        : "text-zinc-400 group-hover:translate-x-0.5"
                    }`}
                  />
                </button>
              );
            })}
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
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: Admin Profile */}
          {activeSection === "profile" && (
            <form
              onSubmit={handleProfileSubmit}
              className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in"
            >
              <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 tracking-tight">
                    {user?.role === UserRole.MANAGER ? "Manager" : "Admin"} Account Profile
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
                      {previewUrl || user?.avatar ? (
                        <img
                          src={previewUrl || user.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={() => setPreviewUrl("")}
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
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Remove Capsule Button Below Avatar */}
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={savingProfile}
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
                      {user?.role === UserRole.MANAGER ? "Manager" : "Admin"} Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={user?.role === UserRole.MANAGER ? "e.g. Manager Name" : "e.g. Administrator"}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                        {user?.role === UserRole.MANAGER ? "Manager Contact Phone (Non-editable)" : "Admin Contact Phone"}
                      </label>
                      {user?.role === UserRole.MANAGER && (
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Locked</span>
                      )}
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                        user?.role === UserRole.MANAGER
                          ? "bg-zinc-100/80 border-zinc-200 text-zinc-500 cursor-not-allowed"
                          : "bg-zinc-50/70 border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white"
                      }`}
                      value={user?.role === UserRole.MANAGER ? user?.phone || "" : formData.phone}
                      onChange={(e) =>
                        user?.role !== UserRole.MANAGER &&
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                      }
                      disabled={user?.role === UserRole.MANAGER}
                      placeholder="10-digit mobile number"
                      required={user?.role !== UserRole.MANAGER}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? "Saving..." : "Update Profile"}</span>
                </button>
              </div>
            </form>
          )}

          {/* SECTION 2: Security & Password */}
          {activeSection === "security" && (
            <form
              onSubmit={handlePasswordSubmit}
              className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in"
            >
              <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 tracking-tight">
                    Security & Password
                  </h3>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    Update your account login credentials with a strong password
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                    value={passData.currentPassword}
                    onChange={(e) =>
                      setPassData({
                        ...passData,
                        currentPassword: e.target.value,
                      })
                    }
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
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                      value={passData.newPassword}
                      onChange={(e) =>
                        setPassData({
                          ...passData,
                          newPassword: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setPassData({
                          ...passData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingPass}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {updatingPass ? "Updating Password..." : "Update Password"}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* SECTION 3: Role & Privileges */}
          {activeSection === "system" && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900">
                    Role & Permissions
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Platform authorization status, assigned privileges, and access tier
                  </p>
                </div>
                <span className="text-[11px] font-bold text-zinc-400">
                  Step 3 of 3
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/70 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Assigned Platform Role
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{user?.role || "ADMIN"}</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/70 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Account Security Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>AUTHENTICATED & ACTIVE</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Logout Button Card (Below all cards on smaller screens) */}
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

export default SettingsPage;
