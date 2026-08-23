import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

export const ShopServicesTab = ({
  services,
  shopId,
  isOpen,
  activeExistingAppt
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-100 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Services & Pricing</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Select a service to book with your barber</p>
        </div>
        <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg">
          {services.length} Service{services.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
        {services.length > 0 ? (
          services.map((service) => (
            <div
              key={service._id}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors gap-3"
            >
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">{service.name}</h3>
                <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>{service.duration} mins</span>
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-sm text-zinc-900">₹{service.price}</span>
                <button
                  onClick={() => navigate(`/booking/${shopId}`)}
                  disabled={!isOpen || !!activeExistingAppt}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  {activeExistingAppt ? 'Booked' : 'Book'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-zinc-400 text-xs">No services listed yet</div>
        )}
      </div>
    </div>
  );
};
