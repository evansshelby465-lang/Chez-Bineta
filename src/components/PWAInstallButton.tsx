import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <div className="glass-panel-orange border border-orange-200 rounded-[32px] p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl btn-liquid-orange text-white">
          <Download className="w-5 h-5" />
        </div>

        <div>
          <h3 className="font-black text-sm text-stone-900">
            Installer Chez Bineta
          </h3>
          <p className="text-xs text-stone-600">
            Ajoutez Chez Bineta à votre écran d’accueil.
          </p>
        </div>
      </div>

      {isInstallable ? (
        <button
          type="button"
          onClick={install}
          className="w-full px-5 py-3 rounded-2xl btn-liquid-orange font-black text-xs"
        >
          📱 Installer l’application
        </button>
      ) : isIOS ? (
        <p className="text-xs text-stone-600">
          Sur iPhone : appuyez sur Partager puis « Sur l’écran d’accueil ».
        </p>
      ) : (
        <p className="text-xs text-stone-600">
          Dans Chrome, ouvrez le menu ⋮ puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».
        </p>
      )}
    </div>
  );
}
