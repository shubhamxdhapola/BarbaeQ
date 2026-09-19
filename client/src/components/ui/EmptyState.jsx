import React from 'react';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-surface-200 rounded-xl bg-surface-50/50">
      <div className="p-4 mb-4 rounded-full bg-primary-50 text-primary-600">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-navy-900">{title}</h3>
      <p className="max-w-md mb-6 text-sm text-surface-500">{description}</p>
      
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
