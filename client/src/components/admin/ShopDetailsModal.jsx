import React from 'react';
import { Modal } from '../ui/Modal';
import {
  Store,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  Users,
  Scissors,
} from 'lucide-react';

export const ShopDetailsModal = ({
  isOpen,
  onClose,
  loadingDetails,
  selectedShopDetails,
  setDocModal,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
                      selectedShopDetails.shop?.isActive !== false
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
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
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
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
  );
};
