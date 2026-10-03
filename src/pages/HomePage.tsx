import React, { useState } from 'react';
import { ArrowRight, MapPin, Phone, MessageSquare, Clock, Calendar, Sparkles, ChefHat, Download, Smartphone, X } from 'lucide-react';
import { Product, StoreStatus } from '../types';
import { RESTAURANT_INFO } from '../data/initialCatalog';
import { ProductCard } from '../components/ProductCard';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HomePageProps {
  products: Product[];
  storeStatus: StoreStatus;
  onNavigateToMenu: (category?: string) => void;
  onOpenSundayModal: () => void;
  onTrackOrder: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  storeStatus,
  onNavigateToMenu,
  onOpenSundayModal,
  onTrackOrder,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);

  const categories = [
    { id: 'tacos', label: 'Mini Tacos', icon: '🌮', price: '350 F' },
    { id: 'pizza', label: 'Mini Pizza', icon: '🍕', price: '350 F' },
    { id: 'fataya', label: 'Fataya', icon: '🥟', price: '100 F' }, // STRICT 100 FCFA
    { id: 'nems', label: 'Nems', icon: '🍤', price: '200 F' },
    { id: 'poutine', label: 'Poutine', icon: '🍲', price: '3 000 F' },
  ];

  return (
    <div className="space-y-8 pb-28 sm:pb-32">
      {/* Ambient background glow orbs */}
      <div className="fixed top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/15 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-60 -right-20 w-96 h-96 rounded-full bg-amber-300/20 blur-3xl pointer-events-none -z-10" />

      {/* Hero Glass Section (iOS 26 Liquid Aesthetic) */}
      <section className="relative overflow-hidden rounded-[36px] glass-panel-elevated p-6 sm:p-10 text-center border border-white">
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Logo with liquid glass badge */}
          <div className="relative mb-4 group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-[0_12px_32px_rgba(255,107,0,0.22)] bg-white border-2 border-white group-hover:scale-105 transition-all duration-300">
              <img
                src={RESTAURANT_INFO.logoUrl}
                alt="Logo Chez Bineta"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/logo.jpg';
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-2 rounded-2xl shadow-md border-2 border-white">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>

          {/* Restaurant Title & Slogan */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 uppercase">
            CHEZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">BINETA</span>
          </h1>

          <p className="mt-2 text-base sm:text-lg text-stone-600 font-semibold">
            {RESTAURANT_INFO.tagline}
          </p>

          {/* Restaurant Status Badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {storeStatus.isOpen ? (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>🟢 OUVERT — Lundi → Samedi : service normal</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200/80 px-4 py-1.5 rounded-full text-xs font-bold text-rose-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>🔴 FERMÉ ACTUELLEMENT</span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200/80 px-4 py-1.5 rounded-full text-xs font-bold text-orange-700 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>🟠 DIMANCHE — SUR RÉSERVATION</span>
            </div>
          </div>

          {/* Main Call to Action */}
          <div className="mt-5 mb-3 relative z-20 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigateToMenu()}
              className="relative z-20 w-full sm:w-auto px-8 py-4 rounded-2xl btn-liquid-orange font-black text-base shadow-[0_12px_28px_rgba(255,107,0,0.35)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <span>COMMANDER MAINTENANT</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenSundayModal}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel hover:bg-white text-orange-600 border border-orange-200/80 font-extrabold text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Réserver pour Dimanche</span>
            </button>
          </div>

          {/* Quick Track order link */}
          <button
            onClick={onTrackOrder}
            className="mt-4 text-xs font-bold text-stone-500 hover:text-orange-600 transition"
          >
            Déjà commandé ? <span className="underline underline-offset-4 text-orange-600">Suivre ma commande (#CB-XXXX)</span>
          </button>
        </div>
      </section>

      {/* PWA INSTALL SYSTEM ON HOME PAGE */}
      {!isInstalled && (
        <section className="glass-panel-orange border border-orange-300/80 rounded-[32px] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 rounded-2xl btn-liquid-orange text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Download className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-stone-900">
                  Installer l’application Chez Bineta
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-2xs">
                  Sans Play Store
                </span>
              </div>

              <p className="text-xs text-stone-600 mt-0.5">
                Ajoutez l’application sur votre téléphone pour commander plus vite et la retrouver dans vos applications.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isInstallable) {
                install();
              } else {
                setShowInstallGuideModal(true);
              }
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl btn-liquid-orange font-black text-xs sm:text-sm shadow-md transition whitespace-nowrap active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Installer l’application</span>
          </button>
        </section>
      )}

      {showInstallGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div
            onClick={() => setShowInstallGuideModal(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-sm glass-panel-elevated rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-white z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-sm sm:text-base text-stone-900">
                  {isIOS ? "Installer sur iPhone / iPad" : "Installer sur Android"}
                </h3>
              </div>

              <button
                onClick={() => setShowInstallGuideModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <p>Pour ajouter l’application sur votre iPhone sans passer par l’App Store :</p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium bg-white/70 p-3 rounded-2xl border border-stone-100">
                  <li>Appuyez sur <strong>Partager</strong> dans Safari.</li>
                  <li>Appuyez sur <strong>« Sur l'écran d'accueil »</strong>.</li>
                  <li>Validez avec <strong>Ajouter</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <p>Pour installer l’application sur Android :</p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium bg-white/70 p-3 rounded-2xl border border-stone-100">
                  <li>Appuyez sur les <strong>3 petits points ⋮</strong> dans Chrome.</li>
                  <li>Appuyez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
                  <li>L'application apparaîtra dans vos applications.</li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowInstallGuideModal(false)}
              className="w-full py-3 rounded-2xl btn-liquid-orange font-bold text-xs cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* Category Pills (iOS Glass Horizontal Grid) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base sm:text-lg font-black text-stone-900">
            Nos Spécialités
          </h2>
          <button
            onClick={() => onNavigateToMenu()}
            className="text-xs font-extrabold text-orange-600 hover:text-orange-700 transition"
          >
            Tout le menu →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigateToMenu(cat.id)}
              className="p-3.5 rounded-3xl glass-panel hover:bg-white border border-white hover:border-orange-200 transition-all text-left flex flex-col justify-between group active:scale-95 shadow-xs hover:shadow-[0_10px_25px_rgba(255,107,0,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-[11px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                  {cat.price}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-stone-800 mt-2">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
              <span>La Carte Chez Bineta</span>
              <Sparkles className="w-5 h-5 text-orange-500" />
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Cuisine maison à Saint-Louis • Fataya authentique à 100 FCFA
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Sunday Glass Showcase Banner */}
      <section className="rounded-[32px] glass-panel-orange p-6 flex flex-col sm:flex-row items-center justify-between gap-5 border border-orange-200/80">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-orange-700 block mb-1">
            Service spécial dimanche
          </span>
          <h3 className="text-lg sm:text-xl font-black text-stone-900">
            Vous souhaitez commander chez Chez Bineta dimanche ?
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
            Le dimanche ne fonctionne pas comme les autres jours. Réservez votre commande à l’avance pour garantir vos délices frais.
          </p>
        </div>
        <button
          onClick={onOpenSundayModal}
          className="flex-shrink-0 px-6 py-3.5 rounded-2xl btn-liquid-orange font-black text-xs sm:text-sm shadow-md transition active:scale-95"
        >
          RÉSERVER POUR DIMANCHE
        </button>
      </section>

      {/* Contact & Location Section */}
      <section className="rounded-[32px] glass-panel p-6 sm:p-8 border border-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="text-[11px] font-black text-orange-600 uppercase tracking-wider">
              Venir ou commander
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5">
              CHEZ BINETA
            </h3>
            <p className="text-xs text-orange-600 font-semibold italic mt-0.5">
              {RESTAURANT_INFO.tagline}
            </p>

            <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-stone-600 font-medium">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>📍 {RESTAURANT_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>📞 Téléphone : {RESTAURANT_INFO.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>🕒 {RESTAURANT_INFO.scheduleWeek}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${RESTAURANT_INFO.phoneClean}`}
              className="flex-1 py-3.5 px-4 rounded-2xl glass-panel hover:bg-white text-stone-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-stone-200/80 shadow-xs transition active:scale-95"
            >
              <Phone className="w-4 h-4 text-orange-500" />
              <span>APPELER BINETA</span>
            </a>

            <a
              href={RESTAURANT_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WHATSAPP (+221 75 508 97 31)</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
