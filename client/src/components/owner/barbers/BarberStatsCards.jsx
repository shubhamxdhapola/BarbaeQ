import React from 'react';
import { Users, CheckCircle2, Coffee, XCircle } from 'lucide-react';

export const BarberStatsCards = ({
  totalCount,
  onDutyCount,
  offDutyCount,
  deactivatedCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* Total Staff */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Total Staff
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            {totalCount}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Registered barbers
          </p>
        </div>
      </div>

      {/* On Duty */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            On Duty
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 flex items-center gap-2">
            <span>{onDutyCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Accepting queue & clients
          </p>
        </div>
      </div>

      {/* Off Duty */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-amber-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Off Duty
          </span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Coffee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {offDutyCount}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            On break / station paused
          </p>
        </div>
      </div>

      {/* Deactivated */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-rose-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Deactivated
          </span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-rose-600">
            {deactivatedCount}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Account access paused
          </p>
        </div>
      </div>
    </div>
  );
};
