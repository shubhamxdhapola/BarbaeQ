import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle2,
  Search,
  Power,
  Trash2,
  Eye,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  Store,
  Calendar,
  Clock,
  Filter,
  Scissors,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  fetchApprovedShopsAdmin,
  toggleShopStatusAdmin,
  deleteShopAdmin,
  fetchShopDetailsAdmin,
} from '../../redux/slices/admin.slice.js';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DocumentModal } from '../../components/ui/DocumentModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { UserRole } from '../../utils/constants.js';

export const ApprovedShopsPage = () => {
  const dispatch = useDispatch();
  const { approvedShops = [], loading, selectedShopDetails, loadingDetails } = useSelector(
    (state) => state.admin
  );
  const { user } = useSelector((state) => state.auth);
  const isManager = user?.role === UserRole.MANAGER;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DEACTIVATED'
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Status toggle confirmation state
  const [statusTarget, setStatusTarget] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete shop confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Document modal preview state
  const [docModal, setDocModal] = useState({ isOpen: false, url: '', title: '' });

  // 3-dots dropdown floating state (for mobile screens)
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (approvedShops.length === 0) {
      dispatch(fetchApprovedShopsAdmin());
    }
  }, [dispatch, approvedShops.length]);

  // Click outside, scroll, or resize listener for floating dropdown
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

  const handleOpenDetails = (shopId) => {
    setOpenDropdownId(null);
    dispatch(fetchShopDetailsAdmin(shopId));
    setDetailsModalOpen(true);
  };

  const handleToggleStatus = (shopId, currentActive) => {
    setOpenDropdownId(null);
    setStatusTarget({ shopId, currentActive });
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    try {
      await dispatch(
        toggleShopStatusAdmin({
          shopId: statusTarget.shopId,
          isActive: !statusTarget.currentActive,
        })
      ).unwrap();
      toast.success(
        `Shop ${!statusTarget.currentActive ? 'activated' : 'deactivated'} successfully`
      );
      setStatusTarget(null);
      dispatch(fetchApprovedShopsAdmin());
    } catch (err) {
      toast.error(err || 'Failed to update shop status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteShopAdmin(deleteTargetId)).unwrap();
      toast.success('Shop deleted successfully');
      setDeleteTargetId(null);
      dispatch(fetchApprovedShopsAdmin());
    } catch (err) {
      toast.error(err || 'Failed to delete shop');
    } finally {
      setIsDeleting(false);
    }
  };

  // Unique list of cities for filter dropdown
  const cities = useMemo(() => {
    const list = new Set();
    approvedShops.forEach((s) => {
      if (s.city) list.add(s.city.trim().toLowerCase());
    });
    return Array.from(list);
  }, [approvedShops]);

  // Filtered approved shops
  const filteredShops = useMemo(() => {
    return approvedShops.filter((s) => {
      const q = searchTerm.toLowerCase();
      const shopName = (s.name || '').toLowerCase();
      const shopCity = (s.city || '').toLowerCase();
      const ownerName = (typeof s.ownerId === 'object' && s.ownerId?.name ? s.ownerId.name : '').toLowerCase();
      const ownerPhone = (typeof s.ownerId === 'object' && s.ownerId?.phone ? s.ownerId.phone : '').toLowerCase();

      const matchesSearch =
        !searchTerm ||
        shopName.includes(q) ||
        shopCity.includes(q) ||
        ownerName.includes(q) ||
        ownerPhone.includes(q);

      const isActive = s.isActive !== false;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'DEACTIVATED' && !isActive);

      const matchesCity = selectedCity === 'ALL' || shopCity === selectedCity.toLowerCase();

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [approvedShops, searchTerm, statusFilter, selectedCity]);

  // Pagination slice
  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShops.slice(start, start + itemsPerPage);
  }, [filteredShops, currentPage, itemsPerPage]);

  const getOwnerName = (s) =>
    typeof s.ownerId === 'object' && s.ownerId ? s.ownerId.name : 'N/A';

  const getApproverName = (s) =>
    typeof s.approvedBy === 'object' && s.approvedBy ? s.approvedBy.name : 'System Admin';

  const activeCount = useMemo(() => {
    return approvedShops.filter((s) => s.isActive !== false).length;
  }, [approvedShops]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Approved Barbershops
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                {approvedShops.length} Total Registered
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Manage verified barbershops, toggle platform visibility, and audit shop operations
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-zinc-50/90 border border-zinc-200/80 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-900 font-black text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{activeCount} Active</span>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <span className="text-xs font-bold text-zinc-600">
            {approvedShops.length - activeCount} Deactivated
          </span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search shop name, city, owner, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              All ({approvedShops.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('ACTIVE');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter('DEACTIVATED');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === 'DEACTIVATED'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              Deactivated ({approvedShops.length - activeCount})
            </button>
          </div>

          {/* City Filter Select */}
          {cities.length > 0 && (
            <div className="relative shrink-0">
              <div className="relative flex items-center">
                <Filter className="w-3.5 h-3.5 absolute left-3.5 text-zinc-500 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs pl-9 pr-8 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer shadow-2xs capitalize"
                >
                  <option value="ALL">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city} className="capitalize">
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Table Card */}
      <div className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
        {loading && approvedShops.length === 0 ? (
          <div className="p-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[850px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] uppercase tracking-wider font-bold text-zinc-500">
                  <th className="px-6 py-4">Shop Details</th>
                  <th className="px-6 py-4">Owner Contact</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Approved By</th>
                  <th className="px-6 py-4">Platform Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
                {paginatedShops.map((s) => {
                  const isActive = s.isActive !== false;
                  const ownerName = getOwnerName(s);
                  const ownerPhone = s.phone || (typeof s.ownerId === 'object' && s.ownerId?.phone ? s.ownerId.phone : '');
                  const approver = getApproverName(s);

                  return (
                    <tr key={s._id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Shop Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {s.avatar || s.shopImage || (s.photos && s.photos.length > 0 ? s.photos[0] : null) ? (
                            <img
                              src={s.avatar || s.shopImage || s.photos[0]}
                              alt={s.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 text-sm leading-snug">{s.name}</p>
                            <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[200px]">
                              {s.address || 'Address pending'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900">{ownerName}</p>
                        {ownerPhone && (
                          <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            {ownerPhone}
                          </p>
                        )}
                      </td>

                      {/* City */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 capitalize">
                          {s.city}
                        </span>
                      </td>

                      {/* Approved By */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-zinc-800 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{approver}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {/* Desktop View (md+) */}
                        <div className="hidden md:flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(s._id)}
                            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer shadow-2xs"
                            title="View Full Audit & Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isManager && (
                            <button
                              onClick={() => handleToggleStatus(s._id, isActive)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                                isActive
                                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={isActive ? 'Deactivate Shop' : 'Activate Shop'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isManager && (
                            <button
                              onClick={() => setDeleteTargetId(s._id)}
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                              title="Delete Shop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Mobile View (<md) */}
                        <div className="md:hidden flex justify-end">
                          <button
                            onClick={(e) => handleToggleDropdown(e, s._id)}
                            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === s._id && (
                            <div
                              ref={dropdownRef}
                              style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                              className="fixed w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-fade-in text-left"
                            >
                              <button
                                onClick={() => handleOpenDetails(s._id)}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-zinc-600" />
                                <span>View Details</span>
                              </button>
                              {!isManager && (
                                <button
                                  onClick={() => handleToggleStatus(s._id, isActive)}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold transition-colors ${
                                    isActive
                                      ? 'text-amber-700 hover:bg-amber-50'
                                      : 'text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                                </button>
                              )}
                              {!isManager && (
                                <button
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setDeleteTargetId(s._id);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete Shop</span>
                                </button>
                              )}
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
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <Store className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900">No approved shops found</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {searchTerm || statusFilter !== 'ALL' || selectedCity !== 'ALL'
                ? 'No shops matched your current search and filter criteria.'
                : 'There are no active or approved barbershops registered on the platform.'}
            </p>
          </div>
        )}
      </div>

      {/* 4. Standalone Pagination Card */}
      {filteredShops.length > 0 && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredShops.length}
            pageSize={itemsPerPage}
            onPageChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Shop Full Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Approved Barbershop Audit & Profile"
        size="lg"
      >
        {loadingDetails || !selectedShopDetails ? (
          <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading complete shop audit details...</p>
          </div>
        ) : (
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Header info */}
            <div className="p-4 sm:p-5 bg-zinc-50 rounded-2xl border border-zinc-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-600" />
                    <span>{selectedShopDetails.shop?.name}</span>
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {selectedShopDetails.shop?.address},{' '}
                      <strong className="capitalize text-zinc-700 font-semibold">
                        {selectedShopDetails.shop?.city}
                      </strong>
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedShopDetails.shop?.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedShopDetails.shop?.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {selectedShopDetails.shop?.isActive !== false ? 'ACTIVE SHOP' : 'DEACTIVATED'}
                  </span>
                </div>
              </div>

              {/* Audit trail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3">
                <div>
                  <span className="text-zinc-500">Approved By: </span>
                  <span className="font-bold text-zinc-900">
                    {selectedShopDetails.shop?.approvedBy?.name || 'System Admin'}
                  </span>
                  {selectedShopDetails.shop?.approvedBy?.role && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-bold text-[10px]">
                      {selectedShopDetails.shop.approvedBy.role}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-zinc-500">Approver Email: </span>
                  <span className="font-semibold text-zinc-800">
                    {selectedShopDetails.shop?.approvedBy?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Approval Date: </span>
                  <span className="font-semibold text-zinc-800">
                    {selectedShopDetails.shop?.approvedAt
                      ? new Date(selectedShopDetails.shop.approvedAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Operating Status: </span>
                  <span
                    className={`font-bold ${
                      selectedShopDetails.shop?.isOpen ? 'text-emerald-600' : 'text-zinc-500'
                    }`}
                  >
                    {selectedShopDetails.shop?.isOpen ? 'OPEN (Live Queue Active)' : 'CLOSED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Info & Contact */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Shop Owner Information</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-zinc-500">Owner Name</p>
                  <p className="font-bold text-zinc-900 text-sm mt-0.5">
                    {selectedShopDetails.shop?.ownerId?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-zinc-400" /> Email
                  </p>
                  <p className="font-semibold text-zinc-800 text-xs mt-0.5">
                    {selectedShopDetails.shop?.ownerId?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-zinc-400" /> Contact Phone
                  </p>
                  <p className="font-semibold text-zinc-800 text-xs mt-0.5">
                    {selectedShopDetails.shop?.phone ||
                      selectedShopDetails.shop?.ownerId?.phone ||
                      'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Legal & Registration Documents</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500">GSTIN: </span>
                  <span className="font-mono font-bold text-zinc-900">
                    {selectedShopDetails.shop?.documents?.gstin || 'Not Provided'}
                  </span>
                </div>
                {selectedShopDetails.shop?.documents?.establishmentCert && (
                  <div>
                    <button
                      onClick={() =>
                        setDocModal({
                          isOpen: true,
                          url: selectedShopDetails.shop.documents.establishmentCert,
                          title: `${selectedShopDetails.shop.name} — Establishment Cert`,
                        })
                      }
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Establishment Cert
                    </button>
                  </div>
                )}
                {selectedShopDetails.shop?.documents?.addressProof && (
                  <div>
                    <button
                      onClick={() =>
                        setDocModal({
                          isOpen: true,
                          url: selectedShopDetails.shop.documents.addressProof,
                          title: `${selectedShopDetails.shop.name} — Address Proof`,
                        })
                      }
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Address Proof
                    </button>
                  </div>
                )}
                {selectedShopDetails.shop?.documents?.shopPhoto && (
                  <div>
                    <button
                      onClick={() =>
                        setDocModal({
                          isOpen: true,
                          url: selectedShopDetails.shop.documents.shopPhoto,
                          title: `${selectedShopDetails.shop.name} — Shop Photo`,
                        })
                      }
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Shop Front Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Barbers List */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Assigned Barbers ({selectedShopDetails.barbers?.length || 0})</span>
                </h4>
              </div>

              {selectedShopDetails.barbers && selectedShopDetails.barbers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedShopDetails.barbers.map((b) => (
                    <div
                      key={b._id}
                      className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex items-center gap-2.5"
                    >
                      {b.userId?.avatar || b.avatar ? (
                        <img
                          src={b.userId?.avatar || b.avatar}
                          alt={b.userId?.name || b.name || 'Barber'}
                          className="w-8 h-8 rounded-lg object-cover border border-zinc-200 shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/80 font-bold text-xs flex items-center justify-center shrink-0">
                          {(b.userId?.name || b.name || 'B').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-zinc-900 truncate">
                          {b.userId?.name || b.name || 'Barber'}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {b.specialty || 'General Haircut'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {b.isActive !== false ? 'Active' : 'Off'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 font-medium">No barbers enrolled yet.</p>
              )}
            </div>

            {/* Offered Services List */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span>Offered Services ({selectedShopDetails.services?.length || 0})</span>
              </h4>

              {selectedShopDetails.services && selectedShopDetails.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedShopDetails.services.map((svc) => (
                    <div
                      key={svc._id}
                      className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 truncate">{svc.name}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">{svc.duration} mins</p>
                      </div>
                      <span className="font-black text-zinc-900 text-sm">₹{svc.price}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 font-medium">No services registered yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!statusTarget}
        onClose={() => !isUpdatingStatus && setStatusTarget(null)}
        onConfirm={confirmToggleStatus}
        title={statusTarget?.currentActive ? 'Deactivate Barbershop' : 'Activate Barbershop'}
        message={`Are you sure you want to ${
          statusTarget?.currentActive ? 'deactivate' : 'activate'
        } this shop? ${
          statusTarget?.currentActive
            ? 'Deactivated shops will be hidden from customer search and customer booking pipelines.'
            : 'Activated shops will resume accepting customer appointments and queues.'
        }`}
        confirmLabel={statusTarget?.currentActive ? 'Deactivate Shop' : 'Activate Shop'}
        confirmVariant={statusTarget?.currentActive ? 'warning' : 'primary'}
        isLoading={isUpdatingStatus}
      />

      {/* Delete Shop Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => !isDeleting && setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Barbershop"
        message="Are you sure you want to permanently delete this shop? This will delete all associated appointments, services, and barber mappings. This action cannot be undone."
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      {/* Document Modal */}
      <DocumentModal
        isOpen={docModal.isOpen}
        onClose={() => setDocModal({ isOpen: false, url: '', title: '' })}
        url={docModal.url}
        title={docModal.title}
      />
    </div>
  );
};

export default ApprovedShopsPage;
