import React from 'react';
import { Play, XCircle, Phone } from 'lucide-react';
import { AppointmentSource } from '../../../utils/constants.js';

const SourceBadge = ({ source }) => (
  source === AppointmentSource.WALK_IN
    ? <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/70 rounded-full uppercase tracking-wider">Walk-in</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full uppercase tracking-wider">Online</span>
);

export const WaitingQueueCard = ({
  waitingAppointments,
  currentAppointment,
  getCustomerName,
  getCustomerPhone,
  isCarriedOver,
  setActionDialog,
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-card border border-zinc-200/80">
      <div className="flex items-center justify-between mb-4 sm:mb-5 border-b border-zinc-100 pb-3.5 sm:pb-4">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Upcoming Queue Line
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">
            Customers waiting in line for your station
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
          {waitingAppointments.length} Waiting
        </span>
      </div>

      {waitingAppointments.length > 0 ? (
        <div className="divide-y divide-zinc-100">
          {waitingAppointments.map((apt, index) => (
            <div
              key={apt._id}
              className="py-3.5 flex items-start justify-between gap-2.5 hover:bg-zinc-50/50 transition-colors px-1.5 sm:px-2 rounded-xl"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h4 className="font-bold text-zinc-900 text-sm leading-snug truncate">
                      {getCustomerName(apt)}
                    </h4>
                    <SourceBadge source={apt.source} />
                    {isCarriedOver(apt.bookedAt) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                        Previous Day
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                    {apt.serviceName} • {apt.serviceDuration} min
                  </p>
                  {getCustomerPhone(apt) && (
                    <div className="hidden sm:block mt-1">
                      <a
                        href={`tel:${getCustomerPhone(apt)}`}
                        className="text-[11px] text-zinc-600 hover:text-zinc-900 font-bold inline-flex items-center gap-1"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{getCustomerPhone(apt)}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {index === 0 && !currentAppointment && (
                  <button
                    onClick={() =>
                      setActionDialog({
                        isOpen: true,
                        type: 'start',
                        appointmentId: apt._id,
                      })
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Start Service"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Start</span>
                  </button>
                )}
                <button
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'noshow',
                      appointmentId: apt._id,
                    })
                  }
                  className="bg-zinc-100 text-zinc-600 hover:bg-rose-50 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Mark No Show"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-400 text-xs font-medium">
          Waiting queue is currently empty.
        </div>
      )}
    </div>
  );
};
