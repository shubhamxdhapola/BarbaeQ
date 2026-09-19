import React from 'react';
import { AlertCircle, CheckCircle, Phone } from 'lucide-react';
import { AppointmentSource } from '../../../utils/constants.js';

const SourceBadge = ({ source }) => (
  source === AppointmentSource.WALK_IN
    ? <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/70 rounded-full uppercase tracking-wider">Walk-in</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full uppercase tracking-wider">Online</span>
);

export const PendingApprovalsCard = ({
  pendingAppointments,
  getCustomerName,
  getCustomerPhone,
  isCarriedOver,
  handleReject,
  handleApprove,
}) => {
  if (!pendingAppointments.length) return null;

  return (
    <div className="bg-amber-50/60 rounded-3xl p-4 sm:p-6 shadow-card border border-amber-200/80">
      <div className="flex items-center justify-between mb-4 border-b border-amber-200/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Booking Requests ({pendingAppointments.length})
            </h2>
            <p className="text-xs text-amber-900/80 font-medium mt-0.5">
              Action required before adding to queue
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block text-xs font-bold px-3 py-1 bg-amber-200/70 text-amber-900 rounded-full border border-amber-300/80">
          Needs Approval
        </span>
      </div>

      <div className="space-y-3">
        {pendingAppointments.map((apt) => (
          <div
            key={apt._id}
            className="bg-white rounded-2xl p-4 shadow-2xs border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
              {apt.customerId?.avatar ? (
                <img
                  src={apt.customerId.avatar}
                  alt={getCustomerName(apt)}
                  className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {getCustomerName(apt).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-snug truncate">
                    {getCustomerName(apt)}
                  </h3>
                  <SourceBadge source={apt.source} />
                  {isCarriedOver(apt.bookedAt) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      Previous Day
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                  {apt.serviceName} • {apt.serviceDuration} min •{' '}
                  <span className="text-emerald-700 font-bold">₹{apt.totalPrice || 0}</span>
                </p>
                {getCustomerPhone(apt) && (
                  <a
                    href={`tel:${getCustomerPhone(apt)}`}
                    className="text-xs text-zinc-600 hover:text-zinc-900 font-bold inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-md bg-zinc-50 border border-zinc-200"
                    title="Call Customer"
                  >
                    <Phone className="w-3 h-3 text-zinc-400" />
                    <span>{getCustomerPhone(apt)}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => handleReject(apt._id)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => handleApprove(apt._id)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
