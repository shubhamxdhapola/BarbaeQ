import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import { fetchMyShop } from '../../redux/slices/shop.slice.js';
import {
  fetchShopBarbers,
  addBarber,
  updateBarber,
  deleteBarber,
} from '../../redux/slices/barber.slice.js';
import { ShopStatus } from '../../utils/constants.js';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

import { BarberStatsCards } from '../../components/owner/barbers/BarberStatsCards';
import { AddBarberModal } from '../../components/owner/barbers/AddBarberModal';
import { EditBarberModal } from '../../components/owner/barbers/EditBarberModal';
import { BarberTableRow } from '../../components/owner/barbers/BarberTableRow';

export const BarbersPage = () => {
  const dispatch = useDispatch();
  const { myShop } = useSelector((state) => state.shop);
  const { barbers = [], loading: isLoading } = useSelector((state) => state.barber);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ON_DUTY' | 'OFF_DUTY' | 'DEACTIVATED'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialty: 'Haircut & Beard',
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
    name: '',
    email: '',
    phone: '',
    specialty: '',
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

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
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
  const isApproved = shopStatus === ShopStatus.APPROVED && !isDeactivatedByAdmin;

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

  // Filtered Barbers
  const filteredBarbers = useMemo(() => {
    return barbers.filter((b) => {
      const name = b.userId?.name?.toLowerCase() || '';
      const email = b.userId?.email?.toLowerCase() || '';
      const phone = b.userId?.phone || '';
      const specialty = b.specialty?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        specialty.includes(query);

      if (!matchesSearch) return false;

      if (statusFilter === 'ON_DUTY') return b.isActive !== false && b.isAvailable !== false;
      if (statusFilter === 'OFF_DUTY') return b.isActive !== false && b.isAvailable === false;
      if (statusFilter === 'DEACTIVATED') return b.isActive === false;

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
      toast.error(isDeactivatedByAdmin ? 'Shop is deactivated' : 'Shop approval required');
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
      name: '',
      email: '',
      phone: '',
      password: '',
      specialty: 'Haircut & Beard',
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    if (isSubmitting) return;
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    setIsAddModalOpen(false);
  };

  const triggerLookup = (phoneVal, emailVal) => {
    const cleanPhone = (phoneVal || '').replace(/\D/g, '').slice(0, 10);
    const cleanEmail = (emailVal || '').toLowerCase().trim();

    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);

    const hasValidPhone = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    if (!hasValidPhone && !hasValidEmail) {
      setLookupState({
        isChecking: false,
        exists: false,
        user: null,
        isAssignedElsewhere: false,
        assignedShopName: null,
        conflict: false,
        conflictMessage: null,
      });
      return;
    }

    setLookupState((prev) => ({
      ...prev,
      isChecking: true,
    }));

    lookupTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.BARBER.LOOKUP_USER, {
          params: {
            phone: hasValidPhone ? cleanPhone : undefined,
            email: hasValidEmail ? cleanEmail : undefined,
          },
        });
        const data = res.data?.data;
        if (data?.exists) {
          setLookupState({
            isChecking: false,
            exists: true,
            user: data,
            isAssignedElsewhere: data.isAssignedToOtherShop,
            assignedShopName: data.assignedShopName,
            conflict: data.conflict || false,
            conflictMessage: data.conflictMessage || null,
          });
          setFormData((prev) => ({
            ...prev,
            name: data.name || prev.name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
          }));
        } else {
          setLookupState({
            isChecking: false,
            exists: false,
            user: null,
            isAssignedElsewhere: false,
            assignedShopName: null,
            conflict: false,
            conflictMessage: null,
          });
        }
      } catch (err) {
        setLookupState({
          isChecking: false,
          exists: false,
          user: null,
          isAssignedElsewhere: false,
          assignedShopName: null,
          conflict: false,
          conflictMessage: null,
        });
      }
    }, 300);
  };

  const handlePhoneChange = (phoneVal) => {
    const clean = phoneVal.replace(/\D/g, '').slice(0, 10);
    const wasExistingFound = lookupState.exists;

    setFormData((prev) => {
      const next = {
        ...prev,
        phone: clean,
        ...(wasExistingFound ? { name: '', email: '' } : {}),
      };
      triggerLookup(clean, next.email);
      return next;
    });
  };

  const handleEmailChange = (emailVal) => {
    const clean = emailVal.trim();
    const wasExistingFound = lookupState.exists;

    setFormData((prev) => {
      const next = {
        ...prev,
        email: clean,
        ...(wasExistingFound && lookupState.user?.email !== clean ? { name: '', phone: '' } : {}),
      };
      triggerLookup(next.phone, clean);
      return next;
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) return;
    if (!isApproved) {
      toast.error(isDeactivatedByAdmin ? 'Shop is deactivated' : 'Shop approval required');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      toast.error('Phone must be 10 digits starting with 6, 7, 8, or 9');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (lookupState.conflict) {
      toast.error(lookupState.conflictMessage || 'Credential mismatch between phone and email.');
      return;
    }

    if (lookupState.isAssignedElsewhere) {
      toast.error(
        `This barber is currently working at "${lookupState.assignedShopName}". A barber can only work at one shop at a time.`
      );
      return;
    }

    if (!lookupState.exists && (!formData.password || formData.password.length < 6)) {
      toast.error('Password must be at least 6 characters for a new account');
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(addBarber({ shopId, data: formData })).unwrap();
      toast.success(
        lookupState.exists
          ? 'Existing user added as barber to your shop!'
          : 'New barber account created & assigned!'
      );
      handleCloseAddModal();
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialty: 'Haircut & Beard',
      });
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || 'Failed to add barber');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (barber) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    setEditingBarber(barber);
    setEditFormData({
      name: barber.userId?.name || '',
      email: barber.userId?.email || '',
      phone: barber.userId?.phone || '',
      specialty: barber.specialty || 'Haircut & Beard',
      isAvailable: barber.isAvailable !== false,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBarber || !isApproved) return;

    if (editFormData.phone && !/^[6-9]\d{9}$/.test(editFormData.phone.trim())) {
      toast.error('Phone must be 10 digits starting with 6, 7, 8, or 9');
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
        })
      ).unwrap();
      toast.success('Barber updated!');
      setEditingBarber(null);
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDuty = async (barber) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    if (barber.isActive === false) {
      toast.error('Cannot change duty status of a deactivated barber. Activate the barber first.');
      return;
    }
    const nextAvailability = barber.isAvailable === false ? true : false;
    try {
      await dispatch(
        updateBarber({
          id: barber._id,
          data: { isAvailable: nextAvailability },
        })
      ).unwrap();
      toast.success(
        `${barber.userId?.name || 'Barber'} is now ${nextAvailability ? 'On Duty' : 'Off Duty'}`
      );
      dispatch(fetchShopBarbers(shopId));
    } catch (err) {
      toast.error(err || 'Failed to update duty status');
    }
  };

  const handleToggleStatus = async (barber) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    try {
      const nextActive = !barber.isActive;
      await dispatch(updateBarber({ id: barber._id, data: { isActive: nextActive } })).unwrap();
      toast.success(`Barber ${nextActive ? 'activated' : 'deactivated'}`);
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || 'Status update failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!barberToDelete || !isApproved) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteBarber(barberToDelete._id)).unwrap();
      toast.success('Barber removed');
      setBarberToDelete(null);
      dispatch(fetchShopBarbers(shopId));
    } catch (error) {
      toast.error(error || 'Delete failed');
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
            Your shop has been <span className="font-black uppercase tracking-wider">DEACTIVATED BY ADMIN</span>. Staff operations are suspended.
          </p>
        </div>
      )}

      {!isApproved && !isDeactivatedByAdmin && shopStatus && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center text-amber-900 shadow-2xs">
          <AlertTriangle className="w-6 h-6 text-amber-600 mr-3.5 shrink-0" />
          <p className="text-sm font-semibold">
            Your shop is currently <span className="font-black uppercase tracking-wider">{shopStatus}</span>. Barber management will unlock once approved.
          </p>
        </div>
      )}

      {/* 1. Header with Dashboard Vibe */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Barbers & Staff</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {barbers.length} Total
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Manage barber accounts, skills & specialties, operational status, and queue access
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
      <BarberStatsCards
        totalCount={barbers.length}
        onDutyCount={onDutyBarbersCount}
        offDutyCount={offDutyBarbersCount}
        deactivatedCount={deactivatedBarbersCount}
      />

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
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              All ({barbers.length})
            </button>
            <button
              onClick={() => setStatusFilter('ON_DUTY')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'ON_DUTY'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              On Duty ({onDutyBarbersCount})
            </button>
            <button
              onClick={() => setStatusFilter('OFF_DUTY')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'OFF_DUTY'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              Off Duty ({offDutyBarbersCount})
            </button>
            <button
              onClick={() => setStatusFilter('DEACTIVATED')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'DEACTIVATED'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              Deactivated ({deactivatedBarbersCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400">
            <div className="w-8 h-8 border-3 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading barbers...</p>
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900">No barbers found</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No staff members matched your current filter criteria.'
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
                {paginatedBarbers.map((b) => (
                  <BarberTableRow
                    key={b._id}
                    barber={b}
                    isApproved={isApproved}
                    openDropdownId={openDropdownId}
                    menuPos={menuPos}
                    dropdownRef={dropdownRef}
                    handleToggleDropdown={handleToggleDropdown}
                    handleToggleDuty={handleToggleDuty}
                    handleOpenEdit={handleOpenEdit}
                    handleToggleStatus={handleToggleStatus}
                    setBarberToDelete={setBarberToDelete}
                    setOpenDropdownId={setOpenDropdownId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Card */}
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
      <AddBarberModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        formData={formData}
        setFormData={setFormData}
        lookupState={lookupState}
        handlePhoneChange={handlePhoneChange}
        handleEmailChange={handleEmailChange}
        handleAddSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Edit Barber Modal */}
      <EditBarberModal
        editingBarber={editingBarber}
        onClose={() => setEditingBarber(null)}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleEditSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!barberToDelete}
        onClose={() => setBarberToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Barber"
        message={`Are you sure you want to remove ${barberToDelete?.userId?.name || 'this barber'} from your shop? Historical records and queue appointments will remain preserved.`}
        confirmText="Remove Barber"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
