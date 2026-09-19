import React from 'react';

export const Skeleton = ({ 
  className = '', 
  width, 
  height, 
  rounded = 'rounded-md' 
}) => {
  const style = {
    width: width || '100%',
    height: height || '1rem',
  };

  return (
    <div 
      className={`bg-zinc-200 animate-pulse ${rounded} ${className}`}
      style={style}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="soft-card p-6 w-full">
      <Skeleton height="1.5rem" width="60%" className="mb-4" />
      <Skeleton height="1rem" width="100%" className="mb-2" />
      <Skeleton height="1rem" width="90%" className="mb-2" />
      <Skeleton height="1rem" width="80%" className="mb-6" />
      <div className="flex justify-end space-x-3">
        <Skeleton height="2.5rem" width="6rem" />
        <Skeleton height="2.5rem" width="6rem" />
      </div>
    </div>
  );
};

export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <div className="flex items-center space-x-4 py-4 px-6 border-b border-zinc-100 w-full">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="flex-1">
          <Skeleton height="1rem" width={`${Math.random() * 40 + 40}%`} />
        </div>
      ))}
    </div>
  );
};
