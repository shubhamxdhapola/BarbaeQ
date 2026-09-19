import React from 'react';
import {
  Scissors,
  Phone,
  Mail,
  Coffee,
  XCircle,
  Edit3,
  Power,
  Trash2,
  MoreVertical,
} from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'B';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const BarberTableRow = ({
  barber: b,
  isApproved,
  openDropdownId,
  menuPos,
  dropdownRef,
  handleToggleDropdown,
  handleToggleDuty,
  handleOpenEdit,
  handleToggleStatus,
  setBarberToDelete,
  setOpenDropdownId,
}) => {
  const isActive = b.isActive !== false;
  const isOnDuty = isActive && b.isAvailable !== false;
  const barberName = b.userId?.name || 'Unnamed Barber';
  const barberPhone = b.userId?.phone;
  const barberEmail = b.userId?.email;
  const barberAvatar = b.userId?.avatar;
  const barberSpecialty = b.specialty || 'General Haircut & Beard';

  return (
    <tr className="hover:bg-zinc-50/70 transition-colors whitespace-nowrap">
      {/* Barber Avatar & Name with Rating */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {barberAvatar ? (
            <img
              src={barberAvatar}
              alt={barberName}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {getInitials(barberName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-zinc-900 truncate">{barberName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {b.averageRating || b.rating ? (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  ★ {b.averageRating ? b.averageRating.toFixed(1) : b.rating}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </td>

      {/* Duty / Availability Status */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        {!isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <XCircle className="w-3.5 h-3.5" /> Deactivated
          </span>
        ) : isOnDuty ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> On Duty
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Coffee className="w-3.5 h-3.5 text-amber-600" /> Off Duty
          </span>
        )}
      </td>

      {/* Specialty */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 whitespace-nowrap">
          <Scissors className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {barberSpecialty}
        </span>
      </td>

      {/* Phone */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        {barberPhone ? (
          <span className="inline-flex items-center gap-1.5 text-zinc-700 font-semibold whitespace-nowrap">
            <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            {barberPhone}
          </span>
        ) : (
          <span className="text-zinc-500 font-medium">—</span>
        )}
      </td>

      {/* Email */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        {barberEmail ? (
          <span className="inline-flex items-center gap-1.5 text-zinc-700 font-semibold whitespace-nowrap">
            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>{barberEmail}</span>
          </span>
        ) : (
          <span className="text-zinc-500 font-medium">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3.5 px-5 text-right whitespace-nowrap">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-end gap-1.5">
          {isActive && (
            <button
              onClick={() => handleToggleDuty(b)}
              disabled={!isApproved}
              className={`p-2 rounded-xl border transition-colors disabled:opacity-40 cursor-pointer shadow-2xs ${
                isOnDuty
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
              title={isOnDuty ? 'Set Off Duty (Take Break)' : 'Set On Duty (Available)'}
            >
              <Coffee className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleOpenEdit(b)}
            disabled={!isApproved}
            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Edit Details"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToggleStatus(b)}
            disabled={!isApproved}
            className={`p-2 rounded-xl border transition-colors disabled:opacity-40 cursor-pointer shadow-2xs ${
              isActive
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={isActive ? 'Deactivate Barber' : 'Activate Barber'}
          >
            <Power className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!isApproved) return;
              setOpenDropdownId(null);
              setBarberToDelete(b);
            }}
            disabled={!isApproved}
            className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Delete Barber"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex justify-end">
          <button
            onClick={(e) => handleToggleDropdown(e, b._id)}
            disabled={!isApproved}
            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-40"
            title="Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openDropdownId === b._id && (
            <div
              ref={dropdownRef}
              style={{
                top: `${menuPos.top}px`,
                left: `${menuPos.left}px`,
              }}
              className="fixed w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-fade-in text-left"
            >
              {isActive && (
                <button
                  onClick={() => handleToggleDuty(b)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                    isOnDuty ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{isOnDuty ? 'Set Off Duty' : 'Set On Duty'}</span>
                </button>
              )}

              <button
                onClick={() => handleOpenEdit(b)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                <span>Edit Details</span>
              </button>

              <button
                onClick={() => handleToggleStatus(b)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors ${
                  isActive ? 'text-rose-700 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isActive ? 'Deactivate' : 'Activate'}</span>
              </button>

              <div className="my-1 border-t border-zinc-100" />

              <button
                onClick={() => {
                  setOpenDropdownId(null);
                  setBarberToDelete(b);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Barber</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};
