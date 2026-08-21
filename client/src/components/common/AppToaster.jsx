import React, { useEffect } from 'react';
import { Toaster, ToastBar, toast, useToasterStore } from 'react-hot-toast';
import { X } from 'lucide-react';

export const AppToaster = () => {
  const { toasts } = useToasterStore();

  // Prevent multiple toasts stacking over each other by keeping only the latest active toast
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= 1)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return (
    <Toaster
      position="bottom-left"
      gutter={8}
      containerStyle={{
        bottom: 24,
        left: 24,
      }}
      toastOptions={{
        duration: 3500,
        style: {
          background: '#F1F5F9',
          color: '#0F172A',
          borderRadius: '20px',
          boxShadow: '0 12px 30px -6px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
          padding: '12px 16px',
          border: '1px solid #E2E8F0',
          minWidth: '260px',
          maxWidth: '360px',
          width: 'auto',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FFFFFF',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar
          toast={t}
          style={{
            ...t.style,
            minWidth: '260px',
            maxWidth: '360px',
            width: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            animation: t.visible
              ? 'toast-slide-up 0.3s ease-out'
              : 'toast-slide-down 0.25s ease-in forwards',
          }}
        >
          {({ icon, message }) => (
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {icon}
                <div className="text-xs sm:text-sm font-semibold text-zinc-900 leading-snug">
                  {message}
                </div>
              </div>
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/70 transition-colors cursor-pointer shrink-0 -mr-1"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
};
