import React from 'react';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin`}
      ></div>
      <span className="ml-2 text-sm text-gray-600">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
