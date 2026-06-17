import React from 'react';

export default function Spinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}