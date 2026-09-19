import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis for large counts
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 w-full ${className}`}>
      {/* Items range indicator */}
      <p className="text-[11px] sm:text-xs font-semibold text-zinc-500 text-center sm:text-left">
        Showing <span className="font-bold text-zinc-900">{startItem}</span> to{' '}
        <span className="font-bold text-zinc-900">{endItem}</span> of{' '}
        <span className="font-bold text-zinc-900">{totalItems}</span> results
      </p>

      {/* Page Navigation Buttons */}
      <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className="flex items-center justify-center gap-0.5 sm:gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="text-[11px] sm:text-xs">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-xs font-bold text-zinc-400">
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className="flex items-center justify-center gap-0.5 sm:gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <span className="text-[11px] sm:text-xs">Next</span>
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
