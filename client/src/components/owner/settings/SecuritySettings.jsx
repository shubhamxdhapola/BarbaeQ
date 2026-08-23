import React, { useState } from 'react';
import { Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance.js';
import { API_PATHS } from '../../../utils/apiPaths.js';

export const SecuritySettings = () => {
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passData.currentPassword || !passData.newPassword) {
      toast.error('Enter current & new password');
      return;
    }

    if (passData.newPassword.length < 6) {
      toast.error('Min 6 characters required');
      return;
    }

    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success(res.data.message || 'Password changed!');
      setPassData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Password update failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white rounded-3xl shadow-card border border-zinc-200/80 p-5 sm:p-7 flex flex-col justify-between space-y-6"
      >
        <div className="space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Security & Password
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Ensure your shop owner management account is secured
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passData.currentPassword}
              onChange={(e) =>
                setPassData({ ...passData, currentPassword: e.target.value })
              }
              placeholder="Enter current password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passData.newPassword}
                onChange={(e) =>
                  setPassData({ ...passData, newPassword: e.target.value })
                }
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passData.confirmPassword}
                onChange={(e) =>
                  setPassData({ ...passData, confirmPassword: e.target.value })
                }
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};
