import React from 'react';
import { Home, UtensilsCrossed, ShoppingBag, Package, MoreHorizontal } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCart,
}) => {
  const { totalItemsCount } = useCart();

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'cart', label: 'Panier', icon: ShoppingBag, isCart: true },
    { id: 'orders', label: 'Suivi', icon: Package },
    { id: 'more', label: 'Plus', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 max-w-lg mx-auto safe-bottom">
      <div className="glass-panel-elevated rounded-3xl p-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isCart) {
            return (
              <button
                key={item.id}
                onClick={onOpenCart}
                className="relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] text-stone-500 hover:text-orange-600 transition-colors group active:scale-92"
              >
                <div className="relative">
                  <div
                    className={`p-2 rounded-2xl transition-all ${
                      totalItemsCount > 0
                        ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(255,107,0,0.35)]'
                        : 'bg-stone-100/80 text-stone-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                  {totalItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md border border-white">
                      {totalItemsCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight mt-1 text-stone-600">
                  Panier
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] transition-all active:scale-92 rounded-2xl ${
                isActive
                  ? 'text-orange-600 font-extrabold'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <div
                className={`p-2 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-600 scale-105'
                    : 'text-stone-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-1">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-0.5 shadow-[0_0_8px_rgba(255,107,0,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
