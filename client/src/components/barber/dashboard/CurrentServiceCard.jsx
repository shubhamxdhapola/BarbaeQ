import React from 'react';
import { Scissors, CheckCircle, Play, Phone } from 'lucide-react';
import { AppointmentSource } from '../../../utils/constants.js';

const SourceBadge = ({ source }) => (
  source === AppointmentSource.WALK_IN
    ? <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/70 rounded-full uppercase tracking-wider">Walk-in</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full uppercase tracking-wider">Online</span>
);

export const CurrentServiceCard = ({
  currentAppointment,
  waitingAppointments,
  getCustomerName,
  getCustomerPhone,
  setActionDialog,
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-card border border-zinc-200/80 space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              Active Queue Station
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">
              Active customer on the chair
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold ${
            currentAppointment
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
              : 'bg-zinc-100 text-zinc-700 border border-zinc-200/70'
          }`}
        >
          {currentAppointment ? 'In Service' : 'Chair Free'}
        </span>
      </div>

      {currentAppointment ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-100/80">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            {currentAppointment.customerId?.avatar ? (
              <img
                src={currentAppointment.customerId.avatar}
                alt={getCustomerName(currentAppointment)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-zinc-200 shadow-sm shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-sm">
                {getCustomerName(currentAppointment).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 truncate">
                  {getCustomerName(currentAppointment)}
                </h3>
                <SourceBadge source={currentAppointment.source} />
              </div>
              <p className="text-xs text-zinc-600 font-semibold mt-0.5">
                {currentAppointment.serviceName} • {currentAppointment.serviceDuration} min •{' '}
                <span className="text-emerald-700 font-bold">
                  ₹{currentAppointment.totalPrice || 0}
                </span>
              </p>
              {getCustomerPhone(currentAppointment) && (
                <a
                  href={`tel:${getCustomerPhone(currentAppointment)}`}
                  className="text-xs text-zinc-700 hover:text-zinc-900 font-bold inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs"
                  title="Call Customer"
                >
                  <Phone className="w-3 h-3 text-zinc-500" />
                  <span>{getCustomerPhone(currentAppointment)}</span>
                </a>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button
              onClick={() =>
                setActionDialog({
                  isOpen: true,
                  type: 'complete',
                  appointmentId: currentAppointment._id,
                })
              }
              className="w-full md:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Service</span>
            </button>
          </div>
        </div>
      ) : waitingAppointments.length > 0 ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 bg-zinc-50/70 p-4 sm:p-5 rounded-2xl border border-zinc-200/80">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            {waitingAppointments[0].customerId?.avatar ? (
              <img
                src={waitingAppointments[0].customerId.avatar}
                alt={getCustomerName(waitingAppointments[0])}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-zinc-200 shadow-2xs shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-2xs">
                {getCustomerName(waitingAppointments[0]).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-zinc-900 text-white">
                  Next Up #{waitingAppointments[0].queueNumber || 1}
                </span>
                <SourceBadge source={waitingAppointments[0].source} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-1 truncate">
                {getCustomerName(waitingAppointments[0])}
              </h3>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                {waitingAppointments[0].serviceName} • {waitingAppointments[0].serviceDuration} min •{' '}
                <span className="text-emerald-700 font-bold">
                  ₹{waitingAppointments[0].totalPrice || 0}
                </span>
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button
              onClick={() =>
                setActionDialog({
                  isOpen: true,
                  type: 'start',
                  appointmentId: waitingAppointments[0]._id,
                })
              }
              className="w-full md:w-auto justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Service</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-zinc-200 rounded-2xl text-center bg-zinc-50/50">
          <p className="text-sm font-bold text-zinc-600">No active service or waiting customers</p>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            New bookings and walk-ins will appear here automatically
          </p>
        </div>
      )}
    </div>
  );
};
