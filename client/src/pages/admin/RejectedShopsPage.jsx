import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  XCircle,
  Search,
  FileText,
  Building2,
  Calendar,
  Phone,
  Mail,
  Filter,
  MapPin,
  User,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { DocumentModal } from '../../components/ui/DocumentModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { fetchRejectedShopsAdmin } from '../../redux/slices/admin.slice.js';

export const RejectedShopsPage = () => {
  const dispatch = useDispatch();
  const { rejectedShops = [], loading } = useSelector((state) => state.admin);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Document modal preview state
  const [docModal, setDocModal] = useState({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    dispatch(fetchRejectedShopsAdmin());
  }, [dispatch]);

  // Unique list of cities for filter dropdown
  const cities = useMemo(() => {
    const list = new Set();
    rejectedShops.forEach((s) => {
      if (s.city) list.add(s.city.trim().toLowerCase());
    });
    return Array.from(list);
  }, [rejectedShops]);

  // Filtered rejected shops
  const filteredShops = useMemo(() => {
    return rejectedShops.filter((s) => {
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
  }, [rejectedShops, searchTerm, selectedCity]);

  // Pagination slice
  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShops.slice(start, start + itemsPerPage);
  }, [filteredShops, currentPage, itemsPerPage]);

  const getOwnerName = (s) =>
    typeof s.ownerId === 'object' && s.ownerId ? s.ownerId.name : 'Shop Owner';

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
                Rejected Applications
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70 shrink-0">
                {rejectedShops.length} Declined
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">
              Review history of rejected shop registration submissions and audit attached documents
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-zinc-50/90 border border-zinc-200/80 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-900 font-black text-sm">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>{rejectedShops.length}</span>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <span className="text-xs font-bold text-zinc-600">Total Rejected</span>
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
                <option value="ALL">All Cities ({rejectedShops.length})</option>
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
      {loading && rejectedShops.length === 0 ? (
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight leading-snug">
                        {s.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 capitalize">
                        {s.city}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        Application Rejected
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

                  {/* Status Pill on Header Right */}
                  <div className="shrink-0 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Rejected
                    </span>
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
                      Click document chips to preview attached legal records.
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
          <h4 className="text-base font-bold text-zinc-900">No rejected shops found</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            {searchTerm || selectedCity !== 'ALL'
              ? 'No rejected applications matched your current search or city filter.'
              : 'There are no rejected shop applications recorded.'}
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

export default RejectedShopsPage;
