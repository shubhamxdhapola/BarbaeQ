import React from 'react';
import { Scissors, Clock, IndianRupee, Edit3, Power, Trash2, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';

export const ServiceTableRow = ({
  service: s,
  isApproved,
  openDropdownId,
  menuPos,
  dropdownRef,
  handleToggleDropdown,
  handleEdit,
  handleToggleActive,
  setServiceToDelete,
  setOpenDropdownId,
}) => {
  const isActive = s.isActive !== false;

  return (
    <tr className="hover:bg-zinc-50/70 transition-colors whitespace-nowrap">
      {/* Service Name */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            <Scissors className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-zinc-900 truncate">{s.name}</p>
          </div>
        </div>
      </td>

      {/* Duration */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {s.duration} mins
        </span>
      </td>

      {/* Price */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <span className="inline-flex items-center gap-0.5 text-zinc-900 font-bold text-sm">
          <IndianRupee className="w-3.5 h-3.5 text-zinc-500" />
          {s.price}
        </span>
      </td>

      {/* Status */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
            <XCircle className="w-3.5 h-3.5" /> Inactive
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3.5 px-5 text-right whitespace-nowrap">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleEdit(s)}
            disabled={!isApproved}
            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Edit Service"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToggleActive(s)}
            disabled={!isApproved}
            className={`p-2 rounded-xl border transition-colors disabled:opacity-40 cursor-pointer shadow-2xs ${
              isActive
                ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={isActive ? 'Deactivate from Booking' : 'Activate for Booking'}
          >
            <Power className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!isApproved) return;
              setOpenDropdownId(null);
              setServiceToDelete(s);
            }}
            disabled={!isApproved}
            className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Delete Service"
          >
            <Trash2 className="w-4 h-4" />
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
              style={{
                top: `${menuPos.top}px`,
                left: `${menuPos.left}px`,
              }}
              className="fixed w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-fade-in text-left"
            >
              <button
                onClick={() => handleEdit(s)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                <span>Edit Service</span>
              </button>

              <button
                onClick={() => handleToggleActive(s)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                  isActive ? 'text-zinc-700 hover:bg-zinc-50' : 'text-emerald-700 hover:bg-emerald-50'
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
};
