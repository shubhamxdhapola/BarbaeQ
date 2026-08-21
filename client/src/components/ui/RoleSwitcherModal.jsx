import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, ArrowRight, User, Store, Scissors, Users, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { switchRole } from '../../redux/slices/auth.slice.js';
import { UserRole } from '../../utils/constants.js';
import { getRoleHomeUrl } from '../ProtectedRoute.jsx';

const ROLE_META = {
  [UserRole.CUSTOMER]: {
    label: 'Customer',
    badge: 'Customer Portal',
    description: 'Book services & track live wait times',
    icon: User,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  [UserRole.SHOP_OWNER]: {
    label: 'Shop Owner',
    badge: 'Owner Dashboard',
    description: 'Manage barbershop, staff & services',
    icon: Store,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  [UserRole.BARBER]: {
    label: 'Barber Specialist',
    badge: 'Barber Station',
    description: 'Manage station queue & client services',
    icon: Scissors,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
  /*
  [UserRole.MANAGER]: {
    label: 'Platform Manager',
    badge: 'Manager Portal',
    description: 'Review and verify partner barbershops',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  */
  [UserRole.ADMIN]: {
    label: 'System Admin',
    badge: 'Admin Console',
    description: 'Full platform control & configuration',
    icon: Shield,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
};

export const RoleSwitcherModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);

  if (!isOpen || !user) return null;

  const currentRole = user.activeRole || user.role;
  const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [{ role: currentRole, isActive: true }];

  const handleRoleSwitch = async (targetRole, isRoleActive) => {
    if (!isRoleActive) {
      toast.error('This role is currently deactivated.');
      return;
    }
    if (targetRole === currentRole) {
      onClose();
      return;
    }

    try {
      const res = await dispatch(switchRole({ role: targetRole })).unwrap();
      const meta = ROLE_META[targetRole];
      toast.success(`Switched to ${meta?.label || targetRole} view`);
      onClose();
      navigate(getRoleHomeUrl(targetRole));
    } catch (error) {
      toast.error(error || 'Failed to switch role');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200/80 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">Switch Workspace Role</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Select a role to switch your active dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {userRoles.map((item) => {
            const roleName = typeof item === 'object' ? item.role : item;
            const isRoleActive = typeof item === 'object' ? item.isActive !== false : true;
            const meta = ROLE_META[roleName];
            if (!meta) return null;
            const Icon = meta.icon;
            const isCurrent = roleName === currentRole;

            return (
              <button
                key={roleName}
                onClick={() => handleRoleSwitch(roleName, isRoleActive)}
                disabled={isLoading || !isRoleActive}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all text-left ${
                  !isRoleActive
                    ? 'border-zinc-200/80 bg-zinc-50/70 opacity-60 cursor-not-allowed'
                    : isCurrent
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm cursor-pointer'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 text-zinc-900 cursor-pointer group'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    !isRoleActive
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200'
                      : isCurrent 
                      ? 'bg-white/10 text-white border-white/20' 
                      : meta.color
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm leading-tight ${
                      !isRoleActive ? 'text-zinc-500' : isCurrent ? 'text-white' : 'text-zinc-900'
                    }`}>
                      {meta.label}
                    </p>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                        Active
                      </span>
                    )}
                    {!isRoleActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 truncate font-medium ${
                      !isRoleActive ? 'text-zinc-400' : isCurrent ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {meta.description}
                  </p>
                </div>

                {isCurrent ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : isRoleActive ? (
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                ) : (
                  <span className="text-[11px] font-medium text-zinc-400">Disabled</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Signed in as <strong className="text-zinc-800">{user.name}</strong></span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
