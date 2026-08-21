import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Scissors,
  Plus,
  Search,
  Phone,
  Mail,
  Lock,
  User,
  Sparkles,
  Power,
  Edit3,
  Trash2,
  AlertTriangle,
  Store,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Star,
  Award,
  Loader2,
  ShieldCheck,
  Coffee,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Pagination } from "../../components/ui/Pagination";
import { fetchMyShop } from "../../redux/slices/shop.slice.js";
import {
  fetchShopBarbers,
  addBarber,
  updateBarber,
  deleteBarber,
} from "../../redux/slices/barber.slice.js";
import { ShopStatus } from "../../utils/constants.js";
import axiosInstance from "../../utils/axiosInstance.js";
import { API_PATHS } from "../../utils/apiPaths.js";

const QUICK_SPECIALTIES = [
  "Haircut & Beard",
  "Hair Styling",
  "Beard Grooming",
  "Facial & Cleanup",
  "Head Massage",
  "Hair Color",
];

const getInitials = (name) => {
  if (!name) return "B";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const BarbersPage = () => {
  const dispatch = useDispatch();
  const { myShop } = useSelector((state) => state.shop);
  const { barbers = [], loading: isLoading } = useSelector(
    (state) => state.barber,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'ON_DUTY' | 'OFF_DUTY' | 'DEACTIVATED'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    specialty: "Haircut & Beard",
  });

  const [lookupState, setLookupState] = useState({
    isChecking: false,
    exists: false,
    user: null,
    isAssignedElsewhere: false,
    assignedShopName: null,
  });
  const lookupTimeoutRef = useRef(null);

  const [editingBarber, setEditingBarber] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    isAvailable: true,
  });

  const [barberToDelete, setBarberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3-dots mobile menu state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!myShop) {
      dispatch(fetchMyShop());
    }
  }, [dispatch, myShop]);

  useEffect(() => {
    if (myShop?._id && barbers.length === 0) {
      dispatch(fetchShopBarbers(myShop._id));
    }
  }, [dispatch, myShop?._id, barbers.length]);

  // Outside click & scroll handler for mobile dropdown menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    const handleScrollOrResize = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  const handleToggleDropdown = (e, id) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const leftPos = Math.max(10, rect.right - 176);
      setMenuPos({
        top: rect.bottom + 6,
        left: leftPos,
      });
      setOpenDropdownId(id);
    }
  };

  const shopId = myShop?._id;
  const shopStatus = myShop?.status;
  const isDeactivatedByAdmin = myShop?.isActive === false;
  const isApproved =
    shopStatus === ShopStatus.APPROVED && !isDeactivatedByAdmin;

  // Barber counts for KPI stats
  const onDutyBarbersCount = useMemo(() => {
    return barbers.filter((b) => b.isActive !== false && b.isAvailable !== false).length;
  }, [barbers]);

  const offDutyBarbersCount = useMemo(() => {
    return barbers.filter((b) => b.isActive !== false && b.isAvailable === false).length;
  }, [barbers]);

  const deactivatedBarbersCount = useMemo(() => {
    return barbers.filter((b) => b.isActive === false).length;
  }, [barbers]);

  const validRatingsCount = useMemo(() => {
    return barbers
      .map((b) => Number(b.rating || b.avgRating || b.averageRating || 0))
      .filter((r) => r > 0).length;
  }, [barbers]);

  const avgStaffRating = useMemo(() => {
    const validRatings = barbers
      .map((b) => Number(b.rating || b.avgRating || b.averageRating || 0))
      .filter((r) => r > 0);
    if (!validRatings.length) return "0.0";
    return (
      validRatings.reduce((a, b) => a + b, 0) / validRatings.length
    ).toFixed(1);
  }, [barbers]);

  // Filtered Barbers
  const filteredBarbers = useMemo(() => {
    return barbers.filter((b) => {
      const name = b.userId?.name?.toLowerCase() || "";
      const email = b.userId?.email?.toLowerCase() || "";
      const phone = b.userId?.phone || "";
      const specialty = b.specialty?.toLowerCase() || "";
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        specialty.includes(query);

      if (!matchesSearch) return false;

      if (statusFilter === "ON_DUTY") return b.isActive !== false && b.isAvailable !== false;
      if (statusFilter === "OFF_DUTY") return b.isActive !== false && b.isAvailable === false;
      if (statusFilter === "DEACTIVATED") return b.isActive === false;

      return true;
    });
  }, [barbers, searchTerm, statusFilter]);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const paginatedBarbers = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredBarbers.slice(start, start + 10);
  }, [filteredBarbers, currentPage]);

  const handleOpenAddModal = () => {
    if (!isApproved) {
      toast.error(
        isDeactivatedByAdmin
          ? "Shop is deactivated"
          : "Shop approval required",
      );
      return;
    }
    setLookupState({
      isChecking: false,
      exists: false,
      user: null,
      isAssignedElsewhere: false,
      assignedShopName: null,
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      specialty: "Haircut & Beard",
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    if (isSubmitting) return;
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    setIsAddModalOpen(false);
  };

  const handlePhoneChange = (phoneVal) => {
    const clean = phoneVal.replace(/\D/g, "").slice(0, 10);
    const wasExistingFound = lookupState.exists;

    setFormData((prev) => ({
      ...prev,
      phone: clean,
      ...(wasExistingFound ? { name: "", email: "" } : {}),
    }));

    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);

    // Immediately reset lookup state when phone number is modified
    setLookupState({
      isChecking: clean.length === 10 && /^[6-9]\d{9}$/.test(clean),
      exists: false,
      user: null,
      isAssignedElsewhere: false,
      assignedShopName: null,
    });

    if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) {
      lookupTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await axiosInstance.get(API_PATHS.BARBER.LOOKUP_USER, {
            params: { phone: clean },
          });
          const data = res.data?.data;
          if (data?.exists) {
            setLookupState({
              isChecking: false,
              exists: true,
              user: data,
              isAssignedElsewhere: data.isAssignedToOtherShop,
              assignedShopName: data.assignedShopName,
            });
            // Overwrite name and email with the found user's details
            setFormData((prev) => ({
              ...prev,
              name: data.name || "",
              email: data.email || "",
            }));
          } else {
            setLookupState({
              isChecking: false,
              exists: false,
              user: null,
              isAssignedElsewhere: false,
              assignedShopName: null,
            });
            // If no user found with this number, clear name and email
            setFormData((prev) => ({
              ...prev,
              name: "",
              email: "",
            }));
          }
        } catch (err) {
          setLookupState({
            isChecking: false,
            exists: false,
            user: null,
            isAssignedElsewhere: false,
            assignedShopName: null,
          });
          setFormData((prev) => ({
            ...prev,
            name: "",
            email: "",
          }));
        }
      }, 300);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) return;
    if (!isApproved) {
      toast.error(
        isDeactivatedByAdmin
          ? "Shop is deactivated"
          : "Shop approval required",
      );
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      toast.error("Phone must be 10 digits starting with 6, 7, 8, or 9");
      return;
    }

    if (lookupState.isAssignedElsewhere) {
      toast.error(
        `This barber is currently working at "${lookupState.assignedShopName}". A barber can only work at one shop at a time.`
      );
      return;
    }

    if (!lookupState.exists && (!formData.password || formData.password.length < 6)) {
      toast.error("Password must be at least 6 characters for a new account");
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(addBarber({ shopId, data: formData })).unwrap();
      toast.success(
        lookupState.exists
          ? "Existing user added as barber to your shop!"
          : "New barber account created & assigned!"
      );
      handleCloseAddModal();
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        specialty: "Haircut & Beard",
      });
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || "Failed to add barber");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (barber) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    setEditingBarber(barber);
    setEditFormData({
      name: barber.userId?.name || "",
      email: barber.userId?.email || "",
      phone: barber.userId?.phone || "",
      specialty: barber.specialty || "Haircut & Beard",
      isAvailable: barber.isAvailable !== false,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBarber || !isApproved) return;

    if (editFormData.phone && !/^[6-9]\d{9}$/.test(editFormData.phone.trim())) {
      toast.error("Phone must be 10 digits starting with 6, 7, 8, or 9");
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(
        updateBarber({
          id: editingBarber._id,
          data: {
            name: editFormData.name.trim(),
            specialty: editFormData.specialty,
            phone: editFormData.phone.trim(),
            email: editFormData.email.trim(),
            isAvailable: editFormData.isAvailable,
          },
        }),
      ).unwrap();
      toast.success("Barber updated!");
      setEditingBarber(null);
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDuty = async (barber) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    if (barber.isActive === false) {
      toast.error("Cannot change duty status of a deactivated barber. Activate the barber first.");
      return;
    }
    const nextAvailability = barber.isAvailable === false ? true : false;
    try {
      await dispatch(
        updateBarber({
          id: barber._id,
          data: { isAvailable: nextAvailability },
        }),
      ).unwrap();
      toast.success(
        `${barber.userId?.name || "Barber"} is now ${nextAvailability ? "On Duty" : "Off Duty"}`
      );
      dispatch(fetchShopBarbers(shopId));
    } catch (err) {
      toast.error(err || "Failed to update duty status");
    }
  };

  const handleToggleStatus = async (barber) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    try {
      const nextActive = !barber.isActive;
      await dispatch(
        updateBarber({ id: barber._id, data: { isActive: nextActive } }),
      ).unwrap();
      toast.success(`Barber ${nextActive ? "activated" : "deactivated"}`);
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || "Status update failed");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!barberToDelete || !isApproved) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteBarber(barberToDelete._id)).unwrap();
      toast.success("Barber removed");
      setBarberToDelete(null);
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Admin Alert Banners */}
      {isDeactivatedByAdmin && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-center text-rose-900 shadow-2xs">
          <AlertTriangle className="w-6 h-6 text-rose-600 mr-3.5 shrink-0" />
          <p className="text-sm font-semibold">
            Your shop has been{" "}
            <span className="font-black uppercase tracking-wider">
              DEACTIVATED BY ADMIN
            </span>
            . Staff operations are suspended.
          </p>
        </div>
      )}

      {!isApproved && !isDeactivatedByAdmin && shopStatus && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center text-amber-900 shadow-2xs">
          <AlertTriangle className="w-6 h-6 text-amber-600 mr-3.5 shrink-0" />
          <p className="text-sm font-semibold">
            Your shop is currently{" "}
            <span className="font-black uppercase tracking-wider">
              {shopStatus}
            </span>
            . Barber management will unlock once approved.
          </p>
        </div>
      )}

      {/* 1. Header with Dashboard Vibe */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Barbers & Staff
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {barbers.length} Total
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Manage barber accounts, skills & specialties, operational status,
              and queue access
            </p>
          </div>
        </div>

        <div className="flex items-center self-start md:self-auto w-full md:w-auto">
          <button
            onClick={handleOpenAddModal}
            disabled={!shopId || !isApproved}
            className="w-full md:w-auto cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Barber</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Total Staff
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">
              {barbers.length}
            </div>
            <p className="text-[11px] text-muted font-medium mt-0.5">
              Registered barbers
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              On Duty
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 flex items-center gap-2">
              <span>{onDutyBarbersCount}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-muted font-medium mt-0.5">
              Accepting queue & clients
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Off Duty
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {offDutyBarbersCount}
            </div>
            <p className="text-[11px] text-muted font-medium mt-0.5">
              On break / station paused
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Deactivated
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">
              {deactivatedBarbersCount}
            </div>
            <p className="text-[11px] text-muted font-medium mt-0.5">
              Account access paused
            </p>
          </div>
        </div>
      </div>

      {/* 3. Barbers Table & Filter Section */}
      <div className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, specialty, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              All ({barbers.length})
            </button>
            <button
              onClick={() => setStatusFilter("ON_DUTY")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "ON_DUTY"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              On Duty ({onDutyBarbersCount})
            </button>
            <button
              onClick={() => setStatusFilter("OFF_DUTY")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "OFF_DUTY"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              Off Duty ({offDutyBarbersCount})
            </button>
            <button
              onClick={() => setStatusFilter("DEACTIVATED")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "DEACTIVATED"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              Deactivated ({deactivatedBarbersCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-muted">
            <div className="w-8 h-8 border-3 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading barbers...</p>
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900">
              No barbers found
            </h4>
            <p className="text-xs text-muted mt-1 max-w-sm">
              {searchTerm || statusFilter !== "ALL"
                ? "No staff members matched your current filter criteria."
                : 'Get started by clicking "+ Add Barber" to register your staff.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[750px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] uppercase tracking-wider font-bold text-zinc-600 whitespace-nowrap">
                  <th className="py-3.5 px-5 whitespace-nowrap">Barber</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Duty Status</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Specialty</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Phone</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Email</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm whitespace-nowrap">
                {paginatedBarbers.map((b) => {
                  const isActive = b.isActive !== false;
                  const isOnDuty = isActive && b.isAvailable !== false;
                  const barberName = b.userId?.name || "Unnamed Barber";
                  const barberPhone = b.userId?.phone;
                  const barberEmail = b.userId?.email;
                  const barberAvatar = b.userId?.avatar;
                  const barberSpecialty =
                    b.specialty || "General Haircut & Beard";

                  return (
                    <tr
                      key={b._id}
                      className="hover:bg-zinc-50/70 transition-colors whitespace-nowrap"
                    >
                      {/* Barber Avatar & Name with Rating */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {barberAvatar ? (
                            <img
                              src={barberAvatar}
                              alt={barberName}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                              {getInitials(barberName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 truncate">
                              {barberName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {b.averageRating || b.rating ? (
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  ★ {b.averageRating ? b.averageRating.toFixed(1) : b.rating}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Duty / Availability Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {!isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <XCircle className="w-3.5 h-3.5" /> Deactivated
                          </span>
                        ) : isOnDuty ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> On Duty
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <Coffee className="w-3.5 h-3.5 text-amber-600" /> Off Duty
                          </span>
                        )}
                      </td>

                      {/* Specialty */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 whitespace-nowrap">
                          <Scissors className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          {barberSpecialty}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {barberPhone ? (
                          <span className="inline-flex items-center gap-1.5 text-zinc-700 font-semibold whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            {barberPhone}
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-medium">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {barberEmail ? (
                          <span className="inline-flex items-center gap-1.5 text-zinc-700 font-semibold whitespace-nowrap">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span>{barberEmail}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-medium">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {/* Desktop View */}
                        <div className="hidden md:flex items-center justify-end gap-1.5">
                          {isActive && (
                            <button
                              onClick={() => handleToggleDuty(b)}
                              disabled={!isApproved}
                              className={`p-2 rounded-xl border transition-colors disabled:opacity-40 cursor-pointer shadow-2xs ${
                                isOnDuty
                                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                              title={
                                isOnDuty
                                  ? "Set Off Duty (Take Break)"
                                  : "Set On Duty (Available)"
                              }
                            >
                              <Coffee className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(b)}
                            disabled={!isApproved}
                            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                            title="Edit Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(b)}
                            disabled={!isApproved}
                            className={`p-2 rounded-xl border transition-colors disabled:opacity-40 cursor-pointer shadow-2xs ${
                              isActive
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={
                              isActive
                                ? "Deactivate Barber"
                                : "Activate Barber"
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (!isApproved) return;
                              setOpenDropdownId(null);
                              setBarberToDelete(b);
                            }}
                            disabled={!isApproved}
                            className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                            title="Delete Barber"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden flex justify-end">
                          <button
                            onClick={(e) => handleToggleDropdown(e, b._id)}
                            disabled={!isApproved}
                            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-40"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === b._id && (
                            <div
                              ref={dropdownRef}
                              style={{
                                top: `${menuPos.top}px`,
                                left: `${menuPos.left}px`,
                              }}
                              className="fixed w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-fade-in text-left"
                            >
                              {isActive && (
                                <button
                                  onClick={() => handleToggleDuty(b)}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                                    isOnDuty
                                      ? "text-amber-700 hover:bg-amber-50"
                                      : "text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  <Coffee className="w-3.5 h-3.5" />
                                  <span>
                                    {isOnDuty ? "Set Off Duty" : "Set On Duty"}
                                  </span>
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEdit(b)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Edit Details</span>
                              </button>

                              <button
                                onClick={() => handleToggleStatus(b)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                                  isActive
                                    ? "text-rose-700 hover:bg-rose-50"
                                    : "text-emerald-700 hover:bg-emerald-50"
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>
                                  {isActive ? "Deactivate" : "Activate"}
                                </span>
                              </button>

                              <div className="my-1 border-t border-zinc-100" />

                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setBarberToDelete(b);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Barber</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Separate Pagination Card */}
      {filteredBarbers.length > 0 && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredBarbers.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add Barber Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Add Barber to Shop"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-1">
          {/* Phone Number Input with Real-Time Lookup */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Mobile Number
              </label>
              {lookupState.isChecking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin text-zinc-600" />
                  Checking account...
                </span>
              )}
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="tel"
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          {/* Account Status Information Banners */}
          {lookupState.exists && lookupState.isAssignedElsewhere && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-900">Already Working at Another Shop</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">
                  This user is currently assigned as an active barber at <strong>&ldquo;{lookupState.assignedShopName}&rdquo;</strong>. A barber can only be assigned to one shop at a time.
                </p>
              </div>
            </div>
          )}

          {lookupState.exists && !lookupState.isAssignedElsewhere && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">
                  Existing Account Found: {lookupState.user?.name}
                </p>
                <p className="text-emerald-700 mt-0.5 leading-relaxed">
                  This user already has a BarbaeQ account. Their existing personal password will be preserved and they will be granted barber access to your shop.
                </p>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Full Name
              </label>
              {lookupState.exists && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                  Registered Account
                </span>
              )}
            </div>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="text"
                readOnly={lookupState.exists}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                  lookupState.exists
                    ? "bg-zinc-100/90 border-zinc-200 text-zinc-800 cursor-not-allowed"
                    : "bg-zinc-50 border-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-white placeholder:text-zinc-400"
                }`}
                value={formData.name}
                onChange={(e) =>
                  !lookupState.exists && setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Vikram Singh"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Email Address
              </label>
              {lookupState.exists && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                  Registered Account
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="email"
                readOnly={lookupState.exists}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                  lookupState.exists
                    ? "bg-zinc-100/90 border-zinc-200 text-zinc-800 cursor-not-allowed"
                    : "bg-zinc-50 border-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-white placeholder:text-zinc-400"
                }`}
                value={formData.email}
                onChange={(e) =>
                  !lookupState.exists && setFormData({ ...formData, email: e.target.value })
                }
                placeholder="barber@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Specialty / Skills
            </label>
            <div className="relative mb-2">
              <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="text"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
                placeholder="e.g. Haircut, Beard Styling, Facial, Head Massage"
              />
            </div>
            {/* Quick-Select Suggestion Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                Quick:
              </span>
              {QUICK_SPECIALTIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormData({ ...formData, specialty: item })}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    formData.specialty === item
                      ? "bg-zinc-900 text-white shadow-2xs"
                      : "bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Password Field: Hidden if existing user, Required if new account */}
          {lookupState.exists ? (
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-200/70 text-zinc-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">Personal Password Preserved</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  The barber will log into their station using their existing personal password.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Initial Login Password
                </label>
                <span className="text-[10px] font-semibold text-zinc-400">
                  Required for new account
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  required={!lookupState.exists}
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimum 6 characters"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Provide an initial password they will use to log into their Barber Station.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              onClick={handleCloseAddModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              disabled={isSubmitting || lookupState.isAssignedElsewhere}
            >
              {isSubmitting
                ? "Processing..."
                : lookupState.exists
                ? "Add as Barber to Shop"
                : "Create & Add Barber"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Barber Modal */}
      <Modal
        isOpen={!!editingBarber}
        onClose={() => !isSubmitting && setEditingBarber(null)}
        title="Edit Barber Details"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="text"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Specialty / Skills
            </label>
            <div className="relative mb-2">
              <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="text"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all"
                value={editFormData.specialty}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    specialty: e.target.value,
                  })
                }
                placeholder="e.g. Haircut, Beard Styling, Facial, Head Massage"
              />
            </div>
            {/* Quick-Select Suggestion Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                Quick:
              </span>
              {QUICK_SPECIALTIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setEditFormData({ ...editFormData, specialty: item })
                  }
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    editFormData.specialty === item
                      ? "bg-zinc-900 text-white shadow-2xs"
                      : "bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Duty / Availability Status
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setEditFormData({ ...editFormData, isAvailable: true })
                }
                className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  editFormData.isAvailable !== false
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                    : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>On Duty</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditFormData({ ...editFormData, isAvailable: false })
                }
                className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  editFormData.isAvailable === false
                    ? "bg-amber-50 border-amber-300 text-amber-800 shadow-2xs"
                    : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Off Duty</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  required
                  type="tel"
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                  value={editFormData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEditFormData({ ...editFormData, phone: digits });
                  }}
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  required
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  placeholder="barber@example.com"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              onClick={() => setEditingBarber(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Compact Delete Barber Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!barberToDelete}
        onClose={() => setBarberToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Barber"
        message={`Remove ${barberToDelete?.userId?.name || "this barber"} from your staff? They will lose access to the barber station.`}
        confirmText={isDeleting ? "Removing..." : "Remove"}
        cancelLabel="Keep"
        type="danger"
      />
    </div>
  );
};
