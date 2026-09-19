import React from 'react';
import { Users, Sparkles, Star } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'B';

export const ShopBarbersTab = ({
  queueLoading,
  queueInfo,
  totalInQueue,
  barbers,
  isOpen,
}) => {
  return (
    <div className="space-y-4">
      {/* Live Queue Cards */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              Live Chair Queue Status
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Real-time availability and wait times</p>
          </div>
          <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-lg">
            {totalInQueue} Waiting
          </span>
        </div>

        {queueLoading ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : queueInfo.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {queueInfo.map((q) => {
              const matchingBarber = barbers?.find(
                (b) => b._id === q.barberId || b._id?.toString() === q.barberId?.toString()
              );
              const isBarberAvailable =
                isOpen !== false &&
                q.isAvailable !== false &&
                matchingBarber?.isAvailable !== false &&
                matchingBarber?.isActive !== false;

              return (
                <div
                  key={q.barberId}
                  className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                    isBarberAvailable
                      ? 'bg-zinc-50 border-zinc-100'
                      : 'bg-zinc-50/60 border-zinc-200/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/80 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                      {q.barberAvatar ? (
                        <img
                          src={q.barberAvatar}
                          alt={q.barberName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(q.barberName)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 text-xs sm:text-sm">{q.barberName}</p>
                      <p className="text-[11px] text-zinc-500">
                        {!isBarberAvailable
                          ? 'Currently off duty'
                          : q.queueLength === 0
                          ? 'No wait'
                          : `${q.queueLength} in line`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      !isBarberAvailable
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : q.queueLength === 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {!isBarberAvailable
                      ? 'Off Duty'
                      : q.queueLength === 0
                      ? 'Ready Now'
                      : `~${q.estimatedWait || 0}m wait`}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-400 text-xs italic">
            Queue is currently clear. Appointments welcome!
          </p>
        )}
      </div>

      {/* Barbers Grid */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Barber Team ({barbers.length})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {barbers.length > 0 ? (
            barbers.map((barber) => {
              const name =
                typeof barber.userId === 'object' && barber.userId
                  ? barber.userId.name
                  : 'Barber';
              const avatar =
                typeof barber.userId === 'object' && barber.userId
                  ? barber.userId.avatar
                  : '';
              const isAvailable =
                isOpen !== false && barber.isAvailable !== false && barber.isActive !== false;

              return (
                <div
                  key={barber._id}
                  className="flex flex-col items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-center"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold mb-1.5 overflow-hidden border border-zinc-200/80 ${
                      isAvailable ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      getInitials(name)
                    )}
                  </div>
                  <span className="text-xs font-semibold text-zinc-900 truncate w-full">{name}</span>
                  {barber.specialty && (
                    <span className="text-[11px] text-amber-700 font-medium truncate w-full mt-0.5">
                      {barber.specialty}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-medium mt-0.5 ${
                      isAvailable ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {isAvailable ? '● Available' : '● Off Duty'}
                  </span>
                  <div className="flex items-center text-[10px] font-bold text-zinc-700 bg-white px-2 py-0.5 rounded-md border border-zinc-200 mt-1.5">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-1" />
                    {barber.averageRating > 0 ? barber.averageRating.toFixed(1) : 'New'}
                    {barber.reviewCount > 0 && (
                      <span className="text-zinc-400 font-normal ml-0.5">
                        ({barber.reviewCount})
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-zinc-400 text-xs col-span-full">No barbers currently listed</p>
          )}
        </div>
      </div>
    </div>
  );
};
