import React from 'react';
import { Modal } from '../../ui/Modal';
import { Phone, User, Mail, Sparkles, Lock, ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const QUICK_SPECIALTIES = [
  'Haircut & Beard',
  'Hair Styling',
  'Beard Grooming',
  'Facial & Cleanup',
  'Head Massage',
  'Hair Color',
];

export const AddBarberModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  lookupState,
  handlePhoneChange,
  handleEmailChange,
  handleAddSubmit,
  isSubmitting
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Barber to Shop"
      size="md"
    >
      <form onSubmit={handleAddSubmit} className="space-y-4 pt-1">
        {/* Phone Number Input with Real-Time Lookup */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Mobile Number
            </label>
            {lookupState.isChecking && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-600" />
                Checking account...
              </span>
            )}
          </div>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              required
              type="tel"
              maxLength={10}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="10-digit mobile number"
            />
          </div>
        </div>

        {/* Email Address Input with Real-Time Lookup */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Email Address
            </label>
            {lookupState.exists && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                Registered Account
              </span>
            )}
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              required
              type="email"
              readOnly={lookupState.exists && !lookupState.conflict}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                lookupState.exists && !lookupState.conflict
                  ? 'bg-zinc-100/90 border-zinc-200 text-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-50 border-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-white placeholder:text-zinc-400'
              }`}
              value={formData.email}
              onChange={(e) => handleEmailChange ? handleEmailChange(e.target.value) : setFormData({ ...formData, email: e.target.value })}
              placeholder="barber@example.com"
            />
          </div>
        </div>

        {/* Account Status Information Banners */}
        {lookupState.conflict && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-900">Credential Conflict</p>
              <p className="text-amber-700 mt-0.5 leading-relaxed">
                {lookupState.conflictMessage || 'The entered mobile number and email address belong to two different accounts.'}
              </p>
            </div>
          </div>
        )}

        {lookupState.exists && lookupState.isAssignedElsewhere && !lookupState.conflict && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-rose-900">Already Working at Another Shop</p>
              <p className="text-rose-700 mt-0.5 leading-relaxed">
                This user is currently assigned as an active barber at <strong>&ldquo;{lookupState.assignedShopName}&rdquo;</strong>. A barber can only be assigned to one shop at a time.
              </p>
            </div>
          </div>
        )}

        {lookupState.exists && !lookupState.isAssignedElsewhere && !lookupState.conflict && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-900">
                Existing Account Found: {lookupState.user?.name}
              </p>
              <p className="text-emerald-700 mt-0.5 leading-relaxed">
                This user already has a BarbaeQ account. Their existing personal password will be preserved and they will be granted barber access to your shop.
              </p>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Full Name
            </label>
            {lookupState.exists && !lookupState.conflict && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                Registered Account
              </span>
            )}
          </div>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              required
              type="text"
              readOnly={lookupState.exists && !lookupState.conflict}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                lookupState.exists && !lookupState.conflict
                  ? 'bg-zinc-100/90 border-zinc-200 text-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-50 border-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-white placeholder:text-zinc-400'
              }`}
              value={formData.name}
              onChange={(e) =>
                (!lookupState.exists || lookupState.conflict) && setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Vikram Singh"
            />
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
              value={formData.specialty}
              onChange={(e) =>
                setFormData({ ...formData, specialty: e.target.value })
              }
              placeholder="e.g. Haircut, Beard Styling, Facial, Head Massage"
            />
          </div>
          {/* Quick-Select Suggestion Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
              Quick:
            </span>
            {QUICK_SPECIALTIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormData({ ...formData, specialty: item })}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  formData.specialty === item
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Password Field */}
        {lookupState.exists ? (
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-200/70 text-zinc-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-zinc-900">Personal Password Preserved</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                The barber will log into their station using their existing personal password.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Initial Login Password
              </label>
              <span className="text-[10px] font-semibold text-zinc-400">
                Required for new account
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                required={!lookupState.exists}
                type="password"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:bg-white transition-all placeholder:text-zinc-400"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Minimum 6 characters"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Provide an initial password they will use to log into their Barber Station.
            </p>
          </div>
        )}

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
            disabled={isSubmitting || lookupState.isAssignedElsewhere}
          >
            {isSubmitting
              ? 'Processing...'
              : lookupState.exists
              ? 'Add as Barber to Shop'
              : 'Create & Add Barber'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
