import React from 'react';
import { Phone, MessageSquare, MapPin, Clock, Download, Heart } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/initialCatalog';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MorePageProps {
  onNavigateToAdmin: () => void;
  onNavigateToSunday: () => void;
}

export const MorePage: React.FC<MorePageProps> = ({
  onNavigateToAdmin,
  onNavigateToSunday,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Brand Header */}
      <div className="glass-panel-elevated rounded-[36px] p-6 sm:p-8 text-center space-y-3 border border-white">
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-[0_8px_24px_rgba(255,107,0,0.18)] mx-auto bg-white border-2 border-white">
          <img
                          loading="lazy"
            src={RESTAURANT_INFO.logoUrl}
            alt="Chez Bineta"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">CHEZ BINETA</h1>
          <p className="text-orange-600 font-extrabold text-sm mt-0.5">
            {RESTAURANT_INFO.tagline}
          </p>
        </div>
      </div>

      {/* PWA Install Card */}
      {(!isInstalled && (isInstallable || isIOS)) && (
        <div className="glass-panel-orange border border-orange-200 rounded-[32px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-3 rounded-2xl btn-liquid-orange text-white shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-stone-900">
                Installer l’application Chez Bineta
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Accès direct depuis votre écran d’accueil pour commander instantanément sur votre téléphone.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isInstallable) {
                install();
              } else if (isIOS) {
                alert('Sur iPhone / iPad : Appuyez sur le bouton Partager dans Safari, puis "Sur l\'écran d\'accueil".');
              }
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl btn-liquid-orange font-black text-xs shadow-md transition whitespace-nowrap active:scale-95"
          >
            Installer sur mon téléphone
          </button>
        </div>
      )}

      {/* Contact card */}
      <div className="glass-panel rounded-[32px] p-6 space-y-4 border border-white shadow-xs">
        <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
          <Phone className="w-4 h-4 text-orange-600" />
          <span>Nous contacter & nous rendre visite</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-stone-600 font-medium">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">Adresse :</strong>
              <p className="text-stone-600">{RESTAURANT_INFO.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">Téléphone direct :</strong>
              <p className="text-stone-600 font-mono font-bold">{RESTAURANT_INFO.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">Horaires de service :</strong>
              <p className="text-stone-600">{RESTAURANT_INFO.scheduleWeek}</p>
              <p className="text-orange-600 font-bold">{RESTAURANT_INFO.scheduleSunday}</p>
            </div>
          </div>
        </div>

        {/* Buttons Appeler & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href={`tel:${RESTAURANT_INFO.phoneClean}`}
            className="py-3.5 px-4 rounded-2xl glass-panel hover:bg-white text-stone-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-stone-200/80 shadow-xs transition active:scale-95"
          >
            <Phone className="w-4 h-4 text-orange-500" />
            <span>📞 APPELER BINETA</span>
          </a>

          <a
            href={RESTAURANT_INFO.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(16,185,129,0.3)] transition active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 WHATSAPP BINETA</span>
          </a>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="glass-panel rounded-[32px] border border-white divide-y divide-stone-100 overflow-hidden text-xs sm:text-sm font-semibold shadow-xs">
        <button
          onClick={onNavigateToSunday}
          className="w-full p-4 flex items-center justify-between text-stone-700 hover:text-orange-600 hover:bg-white/80 transition text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🟠</span>
            <div>
              <span className="text-stone-900 font-extrabold block">Réservations du Dimanche</span>
              <span className="text-[11px] text-stone-500">Service exclusif sur précommande</span>
            </div>
          </div>
          <span className="text-stone-400">→</span>
        </button>

        <button
          onClick={onNavigateToAdmin}
          className="w-full p-4 flex items-center justify-between text-stone-700 hover:text-orange-600 hover:bg-white/80 transition text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👩🏾‍🍳</span>
            <div>
              <span className="text-stone-900 font-extrabold block">Terminal Gérante (Bineta)</span>
              <span className="text-[11px] text-stone-500">Espace cuisine et gestion des commandes</span>
            </div>
          </div>
          <span className="text-stone-400">→</span>
        </button>
      </div>

      {/* Quality commitment */}
      <div className="text-center text-xs text-stone-500 space-y-1">
        <p className="flex items-center justify-center gap-1 font-semibold text-stone-600">
          <span>Préparé avec amour à Saint-Louis</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
        </p>
        <p>Paiement uniquement en espèces • Fataya garanti à 100 FCFA</p>
      </div>
    </div>
  );
};
