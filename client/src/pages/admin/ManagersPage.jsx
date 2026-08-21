import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Trash2,
  Mail,
  Phone,
  Lock,
  User,
  MoreVertical,
  Edit3,
  Power,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  fetchManagersAdmin,
  createManagerAdmin,
  updateManagerAdmin,
  toggleManagerStatusAdmin,
  deleteManagerAdmin,
} from '../../redux/slices/admin.slice.js';
import { UserRole } from '../../utils/constants.js';

export const ManagersPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { managers = [], loading } = useSelector((state) => state.admin);

  if (user && user.role !== UserRole.ADMIN) {
    return <Navigate to="/manager/shops/pending" replace />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track open 3-dots dropdown
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (managers.length === 0) {
      dispatch(fetchManagersAdmin());
    }
  }, [dispatch, managers.length]);

  // Click outside, scroll, or resize to close 3-dots menu
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
      const leftPos = Math.max(10, rect.right - 176); // 176px is w-44
      setMenuPos({
        top: rect.bottom + 6,
        left: leftPos,
      });
      setOpenDropdownId(id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (isEdit) => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!isEdit) {
      if (!formData.email.trim()) {
        errors.email = 'Email address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
        errors.phone = 'Phone number must be 10 digits starting with 6, 7, 8, or 9';
      }
    }
    if (!isEdit && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const handleOpenAdd = () => {
    setEditingManager(null);
    setFormData({ name: '', email: '', phone: '', password: '' });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingManager(m);
    setFormData({
      name: m.name || '',
      email: m.email || '',
      phone: m.phone || '',
      password: '',
    });
    setFormErrors({});
    setOpenDropdownId(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingManager;
    const errors = validateForm(isEdit);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await dispatch(updateManagerAdmin({ id: editingManager._id, data: formData })).unwrap();
        toast.success('Manager updated!');
      } else {
        await dispatch(createManagerAdmin(formData)).unwrap();
        toast.success('Manager created!');
      }
      setIsAddModalOpen(false);
      setEditingManager(null);
      setFormData({ name: '', email: '', phone: '', password: '' });
    } catch (error) {
      toast.error(error || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setOpenDropdownId(null);
    try {
      await dispatch(toggleManagerStatusAdmin(id)).unwrap();
      toast.success(`Manager ${currentStatus ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error(error || 'Status update failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteManagerAdmin(deleteTargetId)).unwrap();
      toast.success('Manager deleted');
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(error || 'Failed to delete manager');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered managers
  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      const q = searchTerm.toLowerCase();
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();

      return !searchTerm || name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [managers, searchTerm]);

  // Pagination slice
  const paginatedManagers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredManagers.slice(start, start + itemsPerPage);
  }, [filteredManagers, currentPage, itemsPerPage]);

  const activeCount = useMemo(() => {
    return managers.filter((m) => m.isActive !== false).length;
  }, [managers]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Platform Managers
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
                {managers.length} Total Accounts
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Authorize staff managers to review and audit incoming barbershop registrations
            </p>
          </div>
        </div>

        <div className="flex items-center self-start md:self-auto w-full md:w-auto">
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Manager</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search manager name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {activeCount} Active
          </span>
          <span className="text-zinc-300">•</span>
          <span>{managers.length - activeCount} Deactivated</span>
        </div>
      </div>

      {/* 3. Table Card */}
      <div className="bg-white rounded-3xl shadow-card border border-zinc-200/80 overflow-hidden">
        {loading && managers.length === 0 ? (
          <div className="p-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : filteredManagers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[750px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] uppercase tracking-wider font-bold text-zinc-500">
                  <th className="px-6 py-4">Manager Profile</th>
                  <th className="px-6 py-4">Contact Information</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
                {paginatedManagers.map((m) => {
                  const isActive = m.isActive !== false;

                  return (
                    <tr key={m._id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Manager Profile */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {m.avatar ? (
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 text-sm leading-snug">{m.name}</p>
                            <p className="text-[11px] text-zinc-400 font-medium">Platform Reviewer</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            {m.email}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            {m.phone || 'No phone'}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Role */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>MANAGER</span>
                        </span>
                      </td>

                      {/* Account Status */}
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
                        {/* Desktop View */}
                        <div className="hidden md:flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer shadow-2xs"
                            title="Edit Manager"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(m._id, isActive)}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                              isActive
                                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(m._id)}
                            className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                            title="Delete Manager"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden flex justify-end">
                          <button
                            onClick={(e) => handleToggleDropdown(e, m._id)}
                            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === m._id && (
                            <div
                              ref={dropdownRef}
                              style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                              className="fixed w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-fade-in text-left"
                            >
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Edit Manager</span>
                              </button>
                              <button
                                onClick={() => handleToggleStatus(m._id, isActive)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold transition-colors ${
                                  isActive
                                    ? 'text-amber-700 hover:bg-amber-50'
                                    : 'text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setDeleteTargetId(m._id);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete Account</span>
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
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900">No managers found</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {searchTerm
                ? 'No manager accounts matched your search query.'
                : 'Get started by creating your first platform reviewer manager account.'}
            </p>
          </div>
        )}
      </div>

      {/* 4. Standalone Pagination Card */}
      {filteredManagers.length > 0 && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-card">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredManagers.length}
            pageSize={itemsPerPage}
            onPageChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Add / Edit Manager Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title={editingManager ? 'Edit Manager Details' : 'Add New Platform Manager'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Henderson"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:bg-white transition-all ${
                  formErrors.name ? 'border-rose-400' : 'border-zinc-200 focus:border-zinc-400'
                }`}
              />
            </div>
            {formErrors.name && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Email Address {editingManager ? '(Non-editable)' : '*'}
              </label>
              {editingManager && (
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Locked</span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!!editingManager}
                placeholder="manager@barbaeq.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                  editingManager
                    ? 'bg-zinc-100/80 border-zinc-200 text-zinc-500 cursor-not-allowed'
                    : formErrors.email
                    ? 'bg-zinc-50/70 border-rose-400 focus:outline-none focus:bg-white'
                    : 'bg-zinc-50/70 border-zinc-200 focus:border-zinc-400 focus:outline-none focus:bg-white'
                }`}
              />
            </div>
            {formErrors.email && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Phone Number {editingManager ? '(Non-editable)' : '*'}
              </label>
              {editingManager && (
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Locked</span>
              )}
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                name="phone"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                disabled={!!editingManager}
                placeholder="10-digit mobile number"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                  editingManager
                    ? 'bg-zinc-100/80 border-zinc-200 text-zinc-500 cursor-not-allowed'
                    : formErrors.phone
                    ? 'bg-zinc-50/70 border-rose-400 focus:outline-none focus:bg-white'
                    : 'bg-zinc-50/70 border-zinc-200 focus:border-zinc-400 focus:outline-none focus:bg-white'
                }`}
              />
            </div>
            {formErrors.phone && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1">{formErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              {editingManager ? 'Password (Leave blank to keep current)' : 'Account Password *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={editingManager ? '••••••••' : 'Minimum 6 characters'}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:bg-white transition-all ${
                  formErrors.password ? 'border-rose-400' : 'border-zinc-200 focus:border-zinc-400'
                }`}
              />
            </div>
            {formErrors.password && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1">{formErrors.password}</p>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-zinc-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : editingManager
                ? 'Update Manager'
                : 'Create Manager Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => !isDeleting && setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Manager Account"
        message="Are you sure you want to delete this manager account? They will immediately lose access to review platform shop registrations."
        confirmLabel="Delete Account"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManagersPage;
