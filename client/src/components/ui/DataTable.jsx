import React from 'react';
import { TableRowSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Search } from 'lucide-react';

export function DataTable({ 
  columns, 
  data, 
  isLoading = false, 
  emptyMessage = 'No data available',
  keyExtractor
}) {
  if (isLoading) {
    return (
      <div className="table-wrap">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center space-x-4">
          {columns.map((col, i) => (
            <div key={i} className="flex-1 text-xs font-semibold text-ink uppercase tracking-wider">
              {col.header}
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns.length} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-wrap">
        <EmptyState 
          icon={Search} 
          title="No records found" 
          description={emptyMessage} 
        />
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className="px-6 py-4 text-left text-xs font-semibold text-ink uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((item) => (
              <tr 
                key={keyExtractor ? keyExtractor(item) : item.id || item._id} 
                className="hover:bg-slate-50 transition"
              >
                {columns.map((col, i) => (
                  <td key={i} className="px-6 py-4 text-sm text-ink">
                    {col.render ? col.render(item) : String(item[col.accessor] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
