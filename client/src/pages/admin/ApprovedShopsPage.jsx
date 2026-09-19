import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle2,
  Search,
  Store,
  Filter,
} from 'lucide-react';
import {
  fetchApprovedShopsAdmin,
  toggleShopStatusAdmin,
  deleteShopAdmin,
  fetchShopDetailsAdmin,
} from '../../redux/slices/admin.slice.js';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DocumentModal } from '../../components/ui/DocumentModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { UserRole } from '../../utils/constants.js';

import { ShopDetailsModal } from '../../components/admin/ShopDetailsModal';
import { ShopTableRow } from '../../components/admin/ShopTableRow';

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
      const ownerName = (
        typeof s.ownerId === 'object' && s.ownerId?.name ? s.ownerId.name : ''
      ).toLowerCase();
      const ownerPhone = (
        typeof s.ownerId === 'object' && s.ownerId?.phone ? s.ownerId.phone : ''
      ).toLowerCase();

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
            placeholder="Search by shop name, city, owner name or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/60">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter('ACTIVE');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter('DEACTIVATED');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'DEACTIVATED'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Deactivated ({approvedShops.length - activeCount})
            </button>
          </div>

          {/* City Filter Dropdown */}
          {cities.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-8 py-2 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs font-bold text-zinc-700 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all cursor-pointer capitalize appearance-none"
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
                {paginatedShops.map((s) => (
                  <ShopTableRow
                    key={s._id}
                    shop={s}
                    isManager={isManager}
                    openDropdownId={openDropdownId}
                    menuPos={menuPos}
                    dropdownRef={dropdownRef}
                    handleToggleDropdown={handleToggleDropdown}
                    handleOpenDetails={handleOpenDetails}
                    handleToggleStatus={handleToggleStatus}
                    setDeleteTargetId={setDeleteTargetId}
                    setOpenDropdownId={setOpenDropdownId}
                  />
                ))}
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
      <ShopDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        loadingDetails={loadingDetails}
        selectedShopDetails={selectedShopDetails}
        setDocModal={setDocModal}
      />

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
