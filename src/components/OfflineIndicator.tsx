import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-4 right-4 z-50 max-w-md mx-auto flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 shadow-2xl animate-bounce">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>Mode hors ligne — Vérifiez votre connexion Internet pour synchroniser vos commandes.</span>
    </div>
  );
};
