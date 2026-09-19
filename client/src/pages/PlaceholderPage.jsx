import React from 'react';
import { useLocation } from 'react-router-dom';

export const PlaceholderPage = ({ title }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="card p-12 text-center max-w-lg w-full animate-fade-in">
        <h1 className="text-3xl font-bold text-navy-900 mb-4">{title || 'Coming Soon'}</h1>
        <p className="text-gray-500 mb-6">
          The page for <code className="bg-gray-100 px-2 py-1 rounded text-primary-600">{location.pathname}</code> is currently under construction.
        </p>
        <button
          onClick={() => window.history.back()}
          className="btn-secondary"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
