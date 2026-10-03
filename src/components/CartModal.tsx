import React, { useEffect, useRef } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { CartView } from './CartView';
import { Order } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  onNavigateToMenu?: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onNavigateToMenu,
}) => {
  const isHistoryPushedRef = useRef(false);

  // 1. Android physical Back button & navigation integration
  useEffect(() => {
    if (!isOpen) return;

    // Push state so Android back gesture closes modal instead of exiting the PWA
    try {
      window.history.pushState({ modal: 'cart' }, '');
      isHistoryPushedRef.current = true;
    } catch {
      // Safe fallback
    }

    const handlePopState = () => {
      isHistoryPushedRef.current = false;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSafeClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleSafeClose = () => {
    if (isHistoryPushedRef.current) {
      isHistoryPushedRef.current = false;
      try {
        window.history.back();
      } catch {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-modal-title"
    >
      {/* Light Blur Backdrop */}
      <div
        onClick={handleSafeClose}
        className="fixed inset-0 bg-stone-950/45 backdrop-blur-md transition-opacity animate-fade-in-overlay cursor-pointer"
        aria-hidden="true"
      />

      {/* Slide-Up Bottom Sheet Card respecting dynamic safe-areas */}
      <div
        className="relative w-full max-w-lg bg-[#faf8f5]/95 backdrop-blur-2xl rounded-t-[36px] sm:rounded-[36px] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white overflow-hidden animate-slide-up-sheet z-10"
        style={{
          maxHeight: 'calc(100dvh - max(20px, env(safe-area-inset-top, 20px)))',
        }}
      >
        {/* iOS Drag Handle */}
        <div
          onClick={handleSafeClose}
          className="pt-2.5 pb-1 flex justify-center sm:hidden cursor-pointer"
          title="Fermer"
        >
          <div className="w-12 h-1.5 bg-stone-300/90 rounded-full active:scale-95 transition" />
        </div>

        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-stone-200/70 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cart-modal-title" className="text-base font-black text-stone-900 leading-tight">
                Mon Panier
              </h2>
              <p className="text-[11px] text-stone-500 font-medium">Chez Bineta • Saint-Louis</p>
            </div>
          </div>

          <button
            onClick={handleSafeClose}
            className="w-9 h-9 rounded-2xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition active:scale-90 cursor-pointer"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container with exact structural sequence */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 overscroll-contain">
          <CartView
            onOrderSuccess={(order) => {
              isHistoryPushedRef.current = false;
              onClose();
              onOrderSuccess(order);
            }}
            onNavigateToMenu={() => {
              handleSafeClose();
              if (onNavigateToMenu) onNavigateToMenu();
            }}
            isModal={true}
            onCloseModal={handleSafeClose}
          />
        </div>
      </div>
    </div>
  );
};
