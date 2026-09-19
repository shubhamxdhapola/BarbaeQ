import React from 'react';
import {
  CheckCircle2,
  Power,
  Trash2,
  Eye,
  MoreVertical,
  Phone,
} from 'lucide-react';

export const ShopTableRow = ({
  shop: s,
  isManager,
  openDropdownId,
  menuPos,
  dropdownRef,
  handleToggleDropdown,
  handleOpenDetails,
  handleToggleStatus,
  setDeleteTargetId,
  setOpenDropdownId,
}) => {
  const isActive = s.isActive !== false;
  const ownerName =
    typeof s.ownerId === 'object' && s.ownerId ? s.ownerId.name : 'N/A';
  const ownerPhone =
    s.phone ||
    (typeof s.ownerId === 'object' && s.ownerId?.phone ? s.ownerId.phone : '');
  const approver =
    typeof s.approvedBy === 'object' && s.approvedBy
      ? s.approvedBy.name
      : 'System Admin';

  return (
    <tr className="hover:bg-zinc-50/70 transition-colors">
      {/* Shop Details */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {s.avatar || s.shopImage || (s.photos && s.photos.length > 0 ? s.photos[0] : null) ? (
            <img
              src={s.avatar || s.shopImage || s.photos[0]}
              alt={s.name}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
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
};
