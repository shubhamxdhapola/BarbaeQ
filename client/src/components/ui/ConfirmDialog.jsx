import React from 'react';
import { Modal } from './Modal';
import { Trash2, AlertTriangle, Info, Play, CheckCircle, Power, Ban } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant,
  isLoading = false,
  type,
  icon: CustomIcon
}) => {
  // Infer / resolve type: 'danger' | 'warning' | 'primary' | 'info'
  let resolvedType = confirmVariant || type;
  const titleLower = title?.toLowerCase() || '';

  const isDeactivate = titleLower.includes('deactivate') || titleLower.includes('suspend') || titleLower.includes('pause');
  const isReject = titleLower.includes('reject');

  if (!resolvedType) {
    if (titleLower.includes('delete') || titleLower.includes('cancel')) {
      resolvedType = 'danger';
    } else if (isDeactivate || titleLower.includes('no-show') || titleLower.includes('noshow')) {
      resolvedType = 'warning';
    } else if (titleLower.includes('start') || titleLower.includes('complete') || titleLower.includes('activate') || titleLower.includes('approve')) {
      resolvedType = 'primary';
    } else {
      resolvedType = 'info';
    }
  }

  // If action is deactivating/suspending/pausing, make sure it is not shown as trash danger
  if (isDeactivate && resolvedType === 'danger') {
    resolvedType = 'warning';
  }

  const isDanger = resolvedType === 'danger';
  const isWarning = resolvedType === 'warning';
  const isPrimary = resolvedType === 'primary';
  const actionText = confirmText || confirmLabel || (isDanger ? 'Delete' : isWarning ? (isDeactivate ? 'Deactivate' : 'Confirm') : 'Confirm');

  // Pick icon based on type or custom icon
  const renderIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-5 h-5" />;
    if (isDeactivate) return <Power className="w-5 h-5" />;
    if (isReject) return <Ban className="w-5 h-5" />;
    if (isDanger) return <Trash2 className="w-5 h-5" />;
    if (isWarning) return <AlertTriangle className="w-5 h-5" />;
    if (titleLower.includes('start')) return <Play className="w-5 h-5" />;
    if (titleLower.includes('complete') || titleLower.includes('approve') || titleLower.includes('activate')) return <CheckCircle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  // Icon container colors
  const iconContainerClass = isDanger
    ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs'
    : isWarning
      ? 'bg-amber-50 text-amber-600 border border-amber-200/80 shadow-2xs'
      : isPrimary
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs'
        : 'bg-zinc-100 text-zinc-800';

  // Confirm button colors
  const confirmBtnClass = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : isWarning
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : isPrimary
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
        : 'bg-zinc-900 hover:bg-zinc-800 text-white';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xs">
      <div className="flex items-start gap-3.5 pt-1 mb-5">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconContainerClass}`}>
          {renderIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-600 text-xs sm:text-sm font-medium leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${confirmBtnClass}`}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : actionText}
        </button>
      </div>
    </Modal>
  );
};
