import React, { useState } from 'react';

interface TryItNowSearchProps {
  onTryNow: (query: string) => void;
  tryNowError?: string | null;
  isTryNowLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export const TryItNowSearch: React.FC<TryItNowSearchProps> = ({
  onTryNow,
  tryNowError = null,
  isTryNowLoading = false,
  className = '',
  placeholder = 'Search any App Store app...'
}) => {
  const [tryNowQuery, setTryNowQuery] = useState('');

  const handleTryNowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tryNowQuery.trim() && onTryNow) {
      onTryNow(tryNowQuery.trim());
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {tryNowError && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold font-mono text-left animate-in fade-in duration-150">
          {tryNowError}
        </div>
      )}
      <form onSubmit={handleTryNowSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          required
          placeholder={placeholder}
          value={tryNowQuery}
          onChange={(e) => setTryNowQuery(e.target.value)}
          disabled={isTryNowLoading}
          className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xs"
        />
        <button
          type="submit"
          disabled={isTryNowLoading}
          className="rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold px-7 py-3.5 text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 text-center"
        >
          {isTryNowLoading ? 'Checking...' : 'Check it'}
        </button>
      </form>
    </div>
  );
};
