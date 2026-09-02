import React, { useEffect, useState } from 'react';

export const ConnectionNotice: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  if (online) return null;
  return <div role="status" className="fixed inset-x-0 bottom-0 z-[100] bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950">You are offline. Changes may not sync until your connection returns.</div>;
};
