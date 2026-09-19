import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Phone,
  Mail,
  Filter,
  MapPin,
  User,
  ExternalLink,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DocumentModal } from '../../components/ui/DocumentModal';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  fetchPendingShops,
  approveShopAdmin,
  rejectShopAdmin,
} from '../../redux/slices/admin.slice.js';

export const PendingShopsPage = () => {
  const dispatch = useDispatch();
  const { pendingShops = [], loading } = useSelector((state) => state.admin);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [selectedShop, setSelectedShop] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Document modal preview state
  const [docModal, setDocModal] = useState({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    if (pendingShops.length === 0) {
      dispatch(fetchPendingShops());
    }
  }, [dispatch, pendingShops.length]);

  // Unique list of cities for filter dropdown
  const cities = useMemo(() => {
    const list = new Set();
    pendingShops.forEach((s) => {
      if (s.city) list.add(s.city.trim().toLowerCase());
    });
    return Array.from(list);
  }, [pendingShops]);

  // Filtered pending shops
  const filteredShops = useMemo(() => {
    return pendingShops.filter((s) => {
      const q = searchTerm.toLowerCase();
      const shopName = (s.name || '').toLowerCase();
      const shopCity = (s.city || '').toLowerCase();
      const ownerName = (typeof s.ownerId === 'object' && s.ownerId?.name ? s.ownerId.name : '').toLowerCase();
      const ownerPhone = (typeof s.ownerId === 'object' && s.ownerId?.phone ? s.ownerId.phone : '').toLowerCase();
      const ownerEmail = (typeof s.ownerId === 'object' && s.ownerId?.email ? s.ownerId.email : '').toLowerCase();

      const matchesSearch =
        !searchTerm ||
        shopName.includes(q) ||
        shopCity.includes(q) ||
        ownerName.includes(q) ||
        ownerPhone.includes(q) ||
        ownerEmail.includes(q);

      const matchesCity = selectedCity === 'ALL' || shopCity === selectedCity.toLowerCase();

      return matchesSearch && matchesCity;
    });
  }, [pendingShops, searchTerm, selectedCity]);

  // Pagination slice
  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShops.slice(start, start + itemsPerPage);
  }, [filteredShops, currentPage, itemsPerPage]);

  const handleConfirm = async () => {
    if (!selectedShop) return;
    try {
      setIsProcessing(true);
      if (selectedShop.action === 'approve') {
        await dispatch(approveShopAdmin(selectedShop.shop._id)).unwrap();
        toast.success('Shop approved!');
      } else {
        await dispatch(rejectShopAdmin(selectedShop.shop._id)).unwrap();
        toast.success('Shop rejected');
      }
      setSelectedShop(null);
      dispatch(fetchPendingShops());
    } catch (error) {
      toast.error(error || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getOwnerName = (s) =>
    typeof s.ownerId === 'object' && s.ownerId?.name ? s.ownerId.name : 'Shop Owner';

  const getOwnerEmail = (s) =>
    typeof s.ownerId === 'object' && s.ownerId?.email ? s.ownerId.email : null;

  const getOwnerPhone = (s) =>
    typeof s.ownerId === 'object' && s.ownerId?.phone ? s.ownerId.phone : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-card border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Pending Shop Approvals
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 shrink-0">
                {pendingShops.length} Awaiting Review
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Review submitted business proof, verify credentials, and onboard shop owners
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-zinc-50/90 border border-zinc-200/80 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-900 font-black text-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{pendingShops.length}</span>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <span className="text-xs font-bold text-zinc-600">Pending Intake</span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search shop name, city, owner, phone or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder:text-zinc-400"
          />
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
                <option value="ALL">All Cities ({pendingShops.length})</option>
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

      {/* 3. Card-Based Applications List */}
      {loading && pendingShops.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-card">
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredShops.length > 0 ? (
        <div className="space-y-4">
          {paginatedShops.map((s) => {
            const d = s.documents || {};
            const ownerName = getOwnerName(s);
            const ownerEmail = getOwnerEmail(s);
            const ownerPhone = getOwnerPhone(s);
            const dateStr = s.createdAt
              ? new Date(s.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <div
                key={s._id}
                className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-card border border-zinc-200/80 hover:border-zinc-300 transition-all flex flex-col gap-4"
              >
                {/* Application Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight leading-snug">
                        {s.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 capitalize">
                        {s.city}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Pending Review
                      </span>
                    </div>

                      {/* Address Row */}
                      <p className="text-xs text-zinc-500 font-medium flex items-start gap-1.5 mt-1.5 leading-relaxed break-words">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span>{s.address || 'Address not specified'}</span>
                      </p>

                      {/* Submission Date Row */}
                      <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Submitted on {dateStr}</span>
                      </p>
                    </div>

                  {/* Decision Buttons */}
                  <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
                    <button
                      onClick={() => setSelectedShop({ shop: s, action: 'approve' })}
                      className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Shop</span>
                    </button>

                    <button
                      onClick={() => setSelectedShop({ shop: s, action: 'reject' })}
                      className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200/80 transition-all cursor-pointer active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {/* Application Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Left Column: Owner Information */}
                  <div className="bg-zinc-50/80 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Shop Owner Profile</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-900">{ownerName}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-200/60 text-xs">
                      <div className="flex items-center gap-2 text-zinc-600">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        {ownerPhone ? (
                          <a href={`tel:${ownerPhone}`} className="font-semibold hover:text-indigo-600 transition-colors">
                            {ownerPhone}
                          </a>
                        ) : (
                          <span className="text-zinc-400">No phone</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        {ownerEmail ? (
                          <a href={`mailto:${ownerEmail}`} className="font-semibold hover:text-indigo-600 transition-colors truncate">
                            {ownerEmail}
                          </a>
                        ) : (
                          <span className="text-zinc-400">No email</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Verification Documents */}
                  <div className="bg-zinc-50/80 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Verification Documents</span>
                        </div>
                        {d.gstin && (
                          <span className="text-[11px] font-mono font-bold text-zinc-700 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                            GSTIN: {d.gstin}
                          </span>
                        )}
                      </div>

                      {/* Document Preview Chips */}
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {d.establishmentCert && (
                          <button
                            type="button"
                            onClick={() =>
                              setDocModal({
                                isOpen: true,
                                url: d.establishmentCert,
                                title: `${s.name} — Establishment Certificate`,
                              })
                            }
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Establishment Cert</span>
                            <Eye className="w-3 h-3 text-zinc-400 ml-0.5" />
                          </button>
                        )}

                        {d.addressProof && (
                          <button
                            type="button"
                            onClick={() =>
                              setDocModal({
                                isOpen: true,
                                url: d.addressProof,
                                title: `${s.name} — Address Proof`,
                              })
                            }
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Address Proof</span>
                            <Eye className="w-3 h-3 text-zinc-400 ml-0.5" />
                          </button>
                        )}

                        {d.shopPhoto && (
                          <button
                            type="button"
                            onClick={() =>
                              setDocModal({
                                isOpen: true,
                                url: d.shopPhoto,
                                title: `${s.name} — Shop Front Photo`,
                              })
                            }
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Shop Photo</span>
                            <Eye className="w-3 h-3 text-zinc-400 ml-0.5" />
                          </button>
                        )}

                        {!d.establishmentCert &&
                          !d.addressProof &&
                          !d.shopPhoto &&
                          !d.gstin &&
                          !d.shopProof && (
                            <span className="text-zinc-400 text-xs font-medium italic">
                              No verification files attached
                            </span>
                          )}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-medium mt-2">
                      Click document chips to preview full legal proof before approving.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-zinc-200/80 shadow-card text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-zinc-900">No pending shops found</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            {searchTerm || selectedCity !== 'ALL'
              ? 'No shop requests matched your current search or city filter.'
              : 'All incoming shop registrations have been reviewed.'}
          </p>
        </div>
      )}

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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedShop}
        onClose={() => !isProcessing && setSelectedShop(null)}
        onConfirm={handleConfirm}
        title={selectedShop?.action === 'approve' ? 'Approve Barbershop' : 'Reject Barbershop Application'}
        message={`Are you sure you want to ${selectedShop?.action} registration for "${selectedShop?.shop?.name}"? ${
          selectedShop?.action === 'approve'
            ? 'The owner will be granted full access to activate barbers and services.'
            : 'The owner will receive notice to correct details and resubmit.'
        }`}
        confirmLabel={selectedShop?.action === 'approve' ? 'Approve & Activate' : 'Reject Application'}
        confirmVariant={selectedShop?.action === 'approve' ? 'primary' : 'danger'}
        isLoading={isProcessing}
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

export default PendingShopsPage;
