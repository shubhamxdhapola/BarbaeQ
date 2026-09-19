import React from 'react';
import { Modal } from '../../ui/Modal';
import { User, Mail, Phone, Sparkles } from 'lucide-react';

const QUICK_SPECIALTIES = [
  'Haircut & Beard',
  'Hair Styling',
  'Beard Grooming',
  'Facial & Cleanup',
  'Head Massage',
  'Hair Color',
];

export const EditBarberModal = ({
  editingBarber,
  onClose,
  editFormData,
  setEditFormData,
  handleEditSubmit,
  isSubmitting
}) => {
  if (!editingBarber) return null;

  return (
    <Modal
      isOpen={!!editingBarber}
      onClose={onClose}
      title="Edit Barber Details"
      size="md"
    >
      <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              required
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
              value={editFormData.name}
              onChange={(e) =>
                setEditFormData({ ...editFormData, name: e.target.value })
              }
              placeholder="e.g. Vikram Singh"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="tel"
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
                placeholder="10-digit phone"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                placeholder="barber@example.com"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
            Specialty / Skills
          </label>
          <div className="relative mb-2">
            <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              required
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
              value={editFormData.specialty}
              onChange={(e) =>
                setEditFormData({ ...editFormData, specialty: e.target.value })
              }
              placeholder="e.g. Haircut, Beard Styling, Facial, Head Massage"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
              Quick:
            </span>
            {QUICK_SPECIALTIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEditFormData({ ...editFormData, specialty: item })}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  editFormData.specialty === item
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
