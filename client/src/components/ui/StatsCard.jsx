import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, color = 'neutral', subtitle }) => {
  const colorMap = {
    neutral: 'bg-zinc-100 text-zinc-900 border border-zinc-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    blue: 'bg-zinc-100 text-zinc-900 border border-zinc-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    purple: 'bg-zinc-100 text-zinc-900 border border-zinc-200',
  };

  return (
    <div className="soft-card p-5">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${colorMap[color] || colorMap.neutral}`}>
            <Icon className="text-xl" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-ink mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
