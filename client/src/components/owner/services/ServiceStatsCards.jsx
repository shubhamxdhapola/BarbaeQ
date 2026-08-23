import React from 'react';
import { Layers, CheckCircle2, Clock, IndianRupee } from 'lucide-react';

export const ServiceStatsCards = ({
  totalCount,
  activeCount,
  avgDuration,
  avgPrice,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* Total Services */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Total Catalog
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">{totalCount}</div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Offerings in salon</p>
        </div>
      </div>

      {/* Active Services */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Active for Booking
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 flex items-center gap-2">
            <span>{activeCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Live on customer menu</p>
        </div>
      </div>

      {/* Avg Duration */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-amber-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Avg Duration
          </span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {avgDuration} <span className="text-sm font-bold text-zinc-500">mins</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Estimated haircut time</p>
        </div>
      </div>

      {/* Avg Price */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Avg Price
          </span>
          <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            ₹{avgPrice}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Average ticket size</p>
        </div>
      </div>
    </div>
  );
};
