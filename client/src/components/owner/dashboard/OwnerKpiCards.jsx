import React from 'react';
import {
  IndianRupee,
  Calendar,
  CheckCircle,
  XCircle,
  UserX,
} from 'lucide-react';

export const OwnerKpiCards = ({
  todayRevenue,
  totalAllRevenue,
  todayBookingsCount,
  totalAllBookingsCount,
  todayCompleted,
  totalCompleted,
  todayCancelled,
  totalAllCancelled,
  todayNoShow,
  totalAllNoShow
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Today Revenue */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Today's Revenue</span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            ₹{todayRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Total all-time: <strong className="text-zinc-700 font-semibold">₹{totalAllRevenue.toLocaleString()}</strong>
          </p>
        </div>
      </div>

      {/* 2. Total Bookings */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Bookings</span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            {todayBookingsCount}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Total all-time: <strong className="text-zinc-700 font-semibold">{totalAllBookingsCount}</strong>
          </p>
        </div>
      </div>

      {/* 3. Completed Visits */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {todayCompleted}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Total completed: <strong className="text-zinc-700 font-semibold">{totalCompleted}</strong>
          </p>
        </div>
      </div>

      {/* 4. Cancelled Appointments */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cancelled</span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-rose-600">
            {todayCancelled}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Total cancelled: <strong className="text-zinc-700 font-semibold">{totalAllCancelled}</strong>
          </p>
        </div>
      </div>

      {/* 5. No Show Appointments */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-card flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">No Show</span>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <UserX className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-600">
            {todayNoShow}
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
            Total no-show: <strong className="text-zinc-700 font-semibold">{totalAllNoShow}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
