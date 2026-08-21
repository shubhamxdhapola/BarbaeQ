import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Scissors, 
  Plus, 
  Search, 
  Clock, 
  IndianRupee, 
  Power, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  MoreVertical,
  Tag,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import { fetchMyShop } from '../../redux/slices/shop.slice.js';
import { fetchShopServices, addService, updateService, deleteService } from '../../redux/slices/service.slice.js';
import { ShopStatus } from '../../utils/constants.js';

const QUICK_SERVICES = [
  { name: 'Classic Haircut', duration: 20, price: 150 },
  { name: 'Beard Styling & Trim', duration: 15, price: 100 },
  { name: 'Haircut + Beard Combo', duration: 30, price: 220 },
  { name: 'Deep Clean Facial', duration: 30, price: 350 },
  { name: 'Head Massage', duration: 20, price: 150 },
  { name: 'Hair Coloring', duration: 45, price: 400 }
];

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60];

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
    return services.filter(s => s.isActive !== false).length;
  }, [services]);

  const inactiveCount = useMemo(() => {
    return services.filter(s => s.isActive === false).length;
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
        price: parseFloat(formData.price)
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

  const openEditModal = (service) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    setFormData({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString()
    });
    setEditingId(service._id);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (service) => {
    if (!isApproved) return;
    setOpenDropdownId(null);
    try {
      const nextActive = !service.isActive;
      await dispatch(updateService({ id: service._id, data: { isActive: nextActive } })).unwrap();
      toast.success(`Service ${nextActive ? 'activated' : 'deactivated'}`);
      dispatch(fetchShopServices({ shopId }));
    } catch (error) {
      toast.error(error || 'Status update failed');
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

  const handleApplyPreset = (preset) => {
    setFormData({
      name: preset.name,
      duration: preset.duration.toString(),
      price: preset.price.toString()
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Admin Alert Banners */}
      {isDeactivatedByAdmin && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-center text-rose-900 shadow-2xs">
          <AlertTriangle className="w-6 h-6 text-rose-600 mr-3.5 shrink-0" />
          <p className="text-sm font-semibold">
            Your shop has been <span className="font-black uppercase tracking-wider">DEACTIVATED BY ADMIN</span>. Managing services is currently disabled.
          </p>
        </div>
      )}

      {!isApproved && !isDeactivatedByAdmin && shopStatus && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center text-amber-900 shadow-2xs">
          <AlertTriangle className="w-6 h-6 text-amber-600 mr-3.5 shrink-0" />
          <p className="text-sm font-semibold">
            Your shop is currently <span className="font-black uppercase tracking-wider">{shopStatus}</span>. Adding and managing services will be enabled once your shop is approved by Admin.
          </p>
        </div>
      )}

      {/* 1. Header with Dashboard Vibe */}
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
              Manage offered grooming services, session durations, and catalog pricing
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

      {/* 2. Top Metric KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Menu</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{services.length}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Offered services</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Active & Bookable</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{activeCount}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Visible to customers</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Avg Session Time</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{avgDuration} <span className="text-sm font-semibold text-zinc-500">mins</span></div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Average slot time</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Average Price</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">₹{avgPrice}</div>
            <p className="text-[11px] text-muted font-medium mt-0.5">Across all services</p>
          </div>
        </div>
      </div>

      {/* 3. Services Table & Filter Section */}
      <div className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search service by name or price..."
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
              Deactivated ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-muted">
            <div className="w-8 h-8 border-3 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900">No services found</h4>
            <p className="text-xs text-muted mt-1 max-w-sm">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'No services matched your current filter criteria.' 
                : 'Get started by clicking "+ Add Service" to add grooming options to your catalog.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[650px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] uppercase tracking-wider font-bold text-zinc-600 whitespace-nowrap">
                  <th className="py-3.5 px-5 whitespace-nowrap">Service</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Duration</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Price</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm whitespace-nowrap">
                {paginatedServices.map((s) => {
                  const isActive = s.isActive !== false;
                  return (
                    <tr key={s._id} className="hover:bg-zinc-50/70 transition-colors whitespace-nowrap">
                      {/* Service Name */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 text-indigo-700 border border-indigo-100/80 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                            <Scissors className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 leading-snug">{s.name}</p>
                            {s.description && (
                              <p className="text-xs text-zinc-500 font-medium line-clamp-1 max-w-[260px] mt-0.5">{s.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/80 text-zinc-800 text-xs font-semibold border border-zinc-200/60 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {s.duration} mins
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-0.5 font-black text-zinc-900 text-sm sm:text-base whitespace-nowrap">
                          <span className="text-zinc-400 font-semibold text-xs">₹</span>
                          <span>{s.price}</span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {/* Desktop View */}
                        <div className="hidden md:flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(s)}
                            disabled={!isApproved}
                            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                            title="Edit Service"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(s)}
                            disabled={!isApproved}
                            className={`p-2 rounded-xl border transition-colors disabled:opacity-40 cursor-pointer shadow-2xs ${
                              isActive
                                ? 'border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Deactivate Service' : 'Activate Service'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (!isApproved) return;
                              setOpenDropdownId(null);
                              setServiceToDelete(s);
                            }}
                            disabled={!isApproved}
                            className="p-2 rounded-xl border border-rose-200/80 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                            title="Delete Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden flex justify-end">
                          <button
                            onClick={(e) => handleToggleDropdown(e, s._id)}
                            disabled={!isApproved}
                            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-40"
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
                                onClick={() => openEditModal(s)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Edit Service</span>
                              </button>

                              <button
                                onClick={() => handleToggleStatus(s)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                                  isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                              </button>

                              <div className="my-1 border-t border-zinc-100" />

                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setServiceToDelete(s);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Service</span>
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
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title={editingId ? 'Edit Service' : 'Add New Service'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">Service Name</label>
            <div className="relative mb-2">
              <Scissors className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                required 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Classic Haircut, Beard Trim" 
              />
            </div>

            {/* Quick-Select Suggestions for new services */}
            {!editingId && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Popular:</span>
                {QUICK_SERVICES.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                      formData.name === preset.name 
                        ? 'bg-zinc-900 text-white shadow-2xs' 
                        : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">Duration (mins)</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  required 
                  type="number" 
                  min="5" 
                  step="5"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400" 
                  value={formData.duration} 
                  onChange={e => setFormData({...formData, duration: e.target.value})} 
                  placeholder="20" 
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">Price (₹)</label>
              <div className="relative">
                <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₹</span>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  step="1" 
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  placeholder="150" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button 
              type="button" 
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer" 
              onClick={() => setIsModalOpen(false)} 
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Service...' : editingId ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Service Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Service"
        message={`Remove "${serviceToDelete?.name || 'this service'}" from your shop catalog? Customers will no longer be able to select it.`}
        confirmText={isDeleting ? 'Removing...' : 'Remove'}
        cancelLabel="Keep"
        type="danger"
      />
    </div>
  );
};
