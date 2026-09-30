import React from 'react';
import { ShoppingBag, ChefHat, Phone, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_INFO } from '../data/initialCatalog';
import { StoreStatus } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  storeStatus: StoreStatus;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  storeStatus,
  onOpenCart,
}) => {
  const { totalItemsCount, totalAmount } = useCart();

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-4 pt-2.5 pb-2">
      <div className="max-w-5xl mx-auto glass-panel rounded-3xl px-4 py-2.5 flex items-center justify-between transition-all duration-300">
        {/* Brand identity */}
        <button
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 text-left group active:scale-98 transition-transform"
        >
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(255,107,0,0.18)] bg-white border border-white/80 flex-shrink-0 group-hover:scale-105 transition-all">
            <img
              src={RESTAURANT_INFO.logoUrl}
              alt="Chez Bineta"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-stone-900 group-hover:text-orange-600 transition-colors">
                CHEZ BINETA
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200/60">
                Saint-Louis
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {storeStatus.isOpen ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ouvert
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Fermé
                </span>
              )}

              {storeStatus.isSundayMode && (
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/50">
                  Dimanche sur réservation
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Right side navigation & cart pill */}
        <div className="flex items-center gap-2">
          {/* Quick call link */}
          <a
            href={`tel:${RESTAURANT_INFO.phoneClean}`}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-stone-700 hover:text-stone-950 bg-white/70 hover:bg-white border border-white/80 shadow-sm transition active:scale-95"
            title="Appeler le restaurant"
          >
            <Phone className="w-3.5 h-3.5 text-orange-500" />
            <span>{RESTAURANT_INFO.phone}</span>
          </a>

          {/* Manager shortcut */}
          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition border active:scale-95 ${
              currentTab === 'admin'
                ? 'bg-orange-500 text-white border-orange-400 shadow-[0_4px_14px_rgba(255,107,0,0.35)]'
                : 'text-stone-700 bg-white/70 hover:bg-white border-white/80 shadow-sm'
            }`}
            title="Terminal Gérante"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Gérante</span>
          </button>

          {/* iOS Liquid Cart Pill */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 btn-liquid-orange font-extrabold px-3.5 sm:px-4 py-2 rounded-2xl text-xs md:text-sm active:scale-95 transition-all"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Panier</span>
            {totalItemsCount > 0 ? (
              <span className="bg-white text-orange-600 text-xs px-2 py-0.5 rounded-xl font-black shadow-sm">
                {totalAmount.toLocaleString('fr-FR')} F
              </span>
            ) : (
              <span className="text-white/90 text-xs">0 F</span>
            )}

            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-md border-2 border-white">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
