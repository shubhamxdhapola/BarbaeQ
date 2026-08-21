import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AlertCircle, User, LogOut, Store } from 'lucide-react';
import { logoutUser } from '../../redux/slices/auth.slice.js';

export const BarberDeactivatedState = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const hasCustomerRole = user?.roles?.includes('CUSTOMER');
  const hasOwnerRole = user?.roles?.includes('SHOP_OWNER');

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 sm:py-16 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
          Barber Station Deactivated
        </h2>

        <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto mb-5">
          Your barber profile at this barbershop has been deactivated by the shop owner. You cannot view queue details or manage appointments while deactivated.
        </p>

        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600 font-medium leading-relaxed mb-6 text-left">
          <p className="font-bold text-zinc-900 mb-0.5">What should I do?</p>
          Please reach out to your shop owner to reactivate your barber station. If you have other roles, you can continue using them below.
        </div>

        <div className="space-y-2.5">
          {hasCustomerRole && (
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Continue to Customer Portal</span>
            </button>
          )}

          {hasOwnerRole && (
            <button
              onClick={() => navigate('/owner/dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 border border-zinc-200"
            >
              <Store className="w-4 h-4" />
              <span>Open Shop Owner Dashboard</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
