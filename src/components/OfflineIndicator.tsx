import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50 max-w-md mx-auto flex items-center justify-center gap-2 rounded-2xl bg-amber-500 text-stone-950 px-4 py-2.5 text-xs font-black shadow-2xl border border-amber-300 animate-fadeIn"
      style={{ top: 'calc(max(10px, env(safe-area-inset-top, 10px)) + 60px)' }}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>Mode hors ligne — Connexion requise pour envoyer les commandes.</span>
    </div>
  );
};
