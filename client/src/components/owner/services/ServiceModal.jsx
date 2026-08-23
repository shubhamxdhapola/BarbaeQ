import React from 'react';
import { Modal } from '../../ui/Modal';
import { Scissors, Clock, IndianRupee } from 'lucide-react';

const QUICK_SERVICES = [
  { name: 'Classic Haircut', duration: 20, price: 150 },
  { name: 'Beard Styling & Trim', duration: 15, price: 100 },
  { name: 'Haircut + Beard Combo', duration: 30, price: 220 },
  { name: 'Deep Clean Facial', duration: 30, price: 350 },
  { name: 'Head Massage', duration: 20, price: 150 },
  { name: 'Hair Coloring', duration: 45, price: 400 },
];

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60];

export const ServiceModal = ({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  handleSubmit,
  isSubmitting
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Edit Service' : 'Add New Service'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
            Service Name
          </label>
          <div className="relative mb-2">
            <Scissors className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              required
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Fade Haircut, Hot Towel Shave"
            />
          </div>

          {!editingId && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                Quick:
              </span>
              {QUICK_SERVICES.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    setFormData({
                      name: item.name,
                      duration: item.duration.toString(),
                      price: item.price.toString(),
                    })
                  }
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    formData.name === item.name
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Duration (Minutes)
            </label>
            <div className="relative mb-2">
              <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="number"
                min="5"
                max="240"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="20"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration: mins.toString() })}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    formData.duration === mins.toString()
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">
              Price (₹ INR)
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required
                type="number"
                min="0"
                step="1"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="150"
              />
            </div>
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
            {isSubmitting ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
