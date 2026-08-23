import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
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
  fetchShopServices,
  addService,
  updateService,
  deleteService,
} from '../../redux/slices/service.slice.js';
import { ShopStatus } from '../../utils/constants.js';

import { ServiceStatsCards } from '../../components/owner/services/ServiceStatsCards';
import { ServiceModal } from '../../components/owner/services/ServiceModal';
import { ServiceTableRow } from '../../components/owner/services/ServiceTableRow';

export const ServicesPage = () => {
  const dispatch = useDispatch();
  const { myShop } = useSelector((state) => state.shop);
  const { services = [], loading: isLoading } = useSelector((state) => state.service);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', duration: '20', price: '' });

  const [serviceToDelete, setServiceToDelete] = useState(null);
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
    if (myShop?._id && services.length === 0) {
      dispatch(fetchShopServices({ shopId: myShop._id }));
    }
  }, [dispatch, myShop?._id, services.length]);

  // Click outside, scroll, or resize listener for mobile menu
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

  // KPI Calculations
  const activeCount = useMemo(() => {
    return services.filter((s) => s.isActive !== false).length;
  }, [services]);

  const avgDuration = useMemo(() => {
    if (!services.length) return 0;
    const total = services.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    return Math.round(total / services.length);
  }, [services]);

  const avgPrice = useMemo(() => {
    if (!services.length) return 0;
    const total = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    return Math.round(total / services.length);
  }, [services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const name = s.name?.toLowerCase() || '';
      const price = s.price?.toString() || '';
      const query = searchTerm.toLowerCase();

      const matchesSearch = name.includes(query) || price.includes(query);
      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE') return s.isActive !== false;
      if (statusFilter === 'INACTIVE') return s.isActive === false;

      return true;
    });
  }, [services, searchTerm, statusFilter]);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredServices.slice(start, start + 10);
  }, [filteredServices, currentPage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) return;
    if (!isApproved) {
      toast.error(isDeactivatedByAdmin ? 'Shop is deactivated' : 'Shop approval required');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
      };

      if (editingId) {
        await dispatch(updateService({ id: editingId, data: payload })).unwrap();
        toast.success('Service updated!');
      } else {
        await dispatch(addService({ shopId, data: payload })).unwrap();
        toast.success('Service added!');
      }

      setIsModalOpen(false);
      setFormData({ name: '', duration: '20', price: '' });
      setEditingId(null);
      dispatch(fetchShopServices({ shopId }));
    } catch (error) {
      toast.error(error || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', duration: '20', price: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (service) => {
    setOpenDropdownId(null);
    setEditingId(service._id);
    setFormData({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (service) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    try {
      const nextActive = service.isActive === false ? true : false;
      await dispatch(updateService({ id: service._id, data: { isActive: nextActive } })).unwrap();
      toast.success(`Service ${nextActive ? 'activated' : 'deactivated'}`);
      dispatch(fetchShopServices({ shopId }));
    } catch (error) {
      toast.error(error || 'Toggle failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete || !isApproved) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteService(serviceToDelete._id)).unwrap();
      toast.success('Service deleted');
      setServiceToDelete(null);
      dispatch(fetchShopServices({ shopId }));
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
            Your shop has been <span className="font-black uppercase tracking-wider">DEACTIVATED BY ADMIN</span>. Service catalog modifications are suspended.
          </p>
        </div>
      )}

      {!isApproved && !isDeactivatedByAdmin && shopStatus && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center text-amber-900 shadow-2xs">
          <AlertTriangle className="w-6 h-6 text-amber-600 mr-3.5 shrink-0" />
          <p className="text-sm font-semibold">
            Your shop is currently <span className="font-black uppercase tracking-wider">{shopStatus}</span>. Service catalog management will unlock once approved.
          </p>
        </div>
      )}

      {/* 1. Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Services & Pricing</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {services.length} Total
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Configure haircut, grooming, and styling offerings with accurate durations and prices
            </p>
          </div>
        </div>

        <div className="flex items-center self-start md:self-auto w-full md:w-auto">
          <button
            onClick={openAddModal}
            disabled={!shopId || !isApproved}
            className="w-full md:w-auto cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <ServiceStatsCards
        totalCount={services.length}
        activeCount={activeCount}
        avgDuration={avgDuration}
        avgPrice={avgPrice}
      />

      {/* 3. Table & Filter Section */}
      <div className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search services by name or price..."
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
              All ({services.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'INACTIVE'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              Inactive ({services.length - activeCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400">
            <div className="w-8 h-8 border-3 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900">No services found</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No catalog items matched your current filter criteria.'
                : 'Get started by clicking "+ Add Service" to define your offerings.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[650px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] uppercase tracking-wider font-bold text-zinc-600 whitespace-nowrap">
                  <th className="py-3.5 px-5 whitespace-nowrap">Service Name</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Duration</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Price</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm whitespace-nowrap">
                {paginatedServices.map((s) => (
                  <ServiceTableRow
                    key={s._id}
                    service={s}
                    isApproved={isApproved}
                    openDropdownId={openDropdownId}
                    menuPos={menuPos}
                    dropdownRef={dropdownRef}
                    handleToggleDropdown={handleToggleDropdown}
                    handleEdit={handleEdit}
                    handleToggleActive={handleToggleActive}
                    setServiceToDelete={setServiceToDelete}
                    setOpenDropdownId={setOpenDropdownId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Card */}
      {filteredServices.length > 0 && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredServices.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add / Edit Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service"
        message={`Are you sure you want to delete "${serviceToDelete?.name}"? Historical appointment records will retain this pricing.`}
        confirmText="Delete Service"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
