import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:right-auto z-50 flex items-center gap-2 rounded-xl bg-[#2D1B1B] border border-[#FF7675]/40 px-3.5 py-2 text-xs font-medium text-[#FF7675] shadow-xl backdrop-blur-md">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7675] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF7675]" />
      </span>
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Mode hors-ligne — Données en cache local actif.</span>
    </div>
  );
};
