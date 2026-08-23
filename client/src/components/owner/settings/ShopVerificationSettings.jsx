import React from 'react';
import { ShieldCheck, Eye, Image as ImageIcon, FileText } from 'lucide-react';

export const ShopVerificationSettings = ({
  shop,
  isDeactivatedByAdmin,
  renderStatusBadge,
  setPreviewModal
}) => {
  const docs = shop?.documents || {};

  const getDocStatusText = (docUrl) => {
    if (!docUrl) return 'Not Uploaded';
    if (isDeactivatedByAdmin) return 'Submitted (Deactivated)';
    if (shop?.status === 'APPROVED') return 'Submitted & Verified ✓';
    if (shop?.status === 'REJECTED') return 'Submitted (Rejected)';
    return 'Submitted (Pending Review)';
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight">
              Submitted Verification Documents
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Government registration documents and ID verification records
            </p>
          </div>
        </div>
        {renderStatusBadge()}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Establishment Cert */}
        <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              1. Establishment Cert
            </p>
            <p
              className={`text-xs font-bold mt-1 ${
                docs.establishmentCert
                  ? shop?.status === 'APPROVED' && !isDeactivatedByAdmin
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                  : 'text-zinc-400'
              }`}
            >
              {getDocStatusText(docs.establishmentCert)}
            </p>
          </div>
          {docs.establishmentCert && (
            <button
              type="button"
              onClick={() =>
                setPreviewModal({
                  isOpen: true,
                  url: docs.establishmentCert,
                  title: 'Establishment Certificate',
                })
              }
              className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-600" /> View Document
            </button>
          )}
        </div>

        {/* Address Proof */}
        <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              2. Address Proof
            </p>
            <p
              className={`text-xs font-bold mt-1 ${
                docs.addressProof
                  ? shop?.status === 'APPROVED' && !isDeactivatedByAdmin
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                  : 'text-zinc-400'
              }`}
            >
              {getDocStatusText(docs.addressProof)}
            </p>
          </div>
          {docs.addressProof && (
            <button
              type="button"
              onClick={() =>
                setPreviewModal({
                  isOpen: true,
                  url: docs.addressProof,
                  title: 'Address Proof',
                })
              }
              className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-600" /> View Document
            </button>
          )}
        </div>

        {/* Shop Front Photo */}
        <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              3. Registration Photo
            </p>
            <p
              className={`text-xs font-bold mt-1 ${
                docs.shopPhoto
                  ? shop?.status === 'APPROVED' && !isDeactivatedByAdmin
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                  : 'text-zinc-400'
              }`}
            >
              {getDocStatusText(docs.shopPhoto)}
            </p>
          </div>
          {docs.shopPhoto && (
            <button
              type="button"
              onClick={() =>
                setPreviewModal({
                  isOpen: true,
                  url: docs.shopPhoto,
                  title: 'Shop Front Photo',
                })
              }
              className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5 text-zinc-600" /> View Photo
            </button>
          )}
        </div>

        {/* GSTIN / Shop Proof */}
        <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              4. GSTIN / Tax Record
            </p>
            <p
              className={`text-xs font-bold mt-1 ${
                docs.gstin
                  ? shop?.status === 'APPROVED' && !isDeactivatedByAdmin
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                  : 'text-zinc-400'
              }`}
            >
              {docs.gstin ? getDocStatusText(docs.gstin) : 'Not Provided'}
            </p>
          </div>
          {docs.gstin && (
            <button
              type="button"
              onClick={() =>
                setPreviewModal({
                  isOpen: true,
                  url: docs.gstin,
                  title: 'GSTIN Document',
                })
              }
              className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-600" /> View Record
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
