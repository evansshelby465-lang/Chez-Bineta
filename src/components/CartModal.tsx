import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Store, Bike, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { Order } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();

  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [address, setAddress] = useState('');
  const [quartier, setQuartier] = useState('');
  const [indications, setIndications] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    setErrorMessage(null);

    // Form validation
    if (!customerName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMessage('Veuillez renseigner un numéro de téléphone valide pour vous joindre.');
      return;
    }
    if (mode === 'delivery') {
      if (!address.trim() && !quartier.trim()) {
        setErrorMessage('Pour la livraison, veuillez préciser votre quartier et votre adresse.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { placeOrder } = await import('../services/orderService');

      const order = await placeOrder({
        customerName,
        phone,
        mode,
        pickupTime: mode === 'pickup' ? pickupTime : undefined,
        address: mode === 'delivery' ? address : undefined,
        quartier: mode === 'delivery' ? quartier : undefined,
        indications: mode === 'delivery' ? indications : undefined,
        rawItems: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variant: i.variant,
        })),
        notes,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe catch
      }

      clearCart();
      onOrderSuccess(order);
    } catch (err: unknown) {
      console.error('Order creation error:', err);
      const msg = err instanceof Error ? err.message : 'Erreur lors de la validation.';
      setErrorMessage(
        msg.includes('offline') || msg.includes('network')
          ? '⚠️ Impossible d’enregistrer la commande. Vérifiez votre connexion Internet et réessayez.'
          : msg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-md p-0 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg glass-panel-elevated sm:rounded-[36px] max-h-[92vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.18)] overflow-hidden border border-white">
        {/* iOS Drag Handle on Mobile */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/60 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <span>🛒 Mon Panier</span>
              <span className="text-xs bg-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                {items.length} {items.length > 1 ? 'articles' : 'article'}
              </span>
            </h2>
            <p className="text-xs text-stone-500">Paiement en espèces uniquement</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-2xl">
                🛒
              </div>
              <p className="text-base font-extrabold text-stone-900">Votre panier est vide</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Explorez nos délices Chez Bineta (Fatayas à 100 F, Tacos, Nems, Pizza, Poutine) et ajoutez-les ici !
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variant || 'none'}`}
                    className="flex items-center gap-3 bg-white/80 p-3 rounded-2xl border border-white shadow-xs"
                  >
                    <img
                          loading="lazy"
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl bg-stone-100 flex-shrink-0 border border-stone-200/50"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-stone-900 truncate">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variant)}
                          className="text-stone-400 hover:text-rose-500 p-1 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.variant && (
                        <span className="inline-block text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/60 mt-0.5">
                          {item.variant}
                        </span>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-orange-600 font-extrabold">
                          {item.price.toLocaleString('fr-FR')} FCFA
                        </span>

                        {/* Controls */}
                        <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200/60">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-950 transition active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-black text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-950 transition active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-black text-stone-900">
                          {item.lineTotal.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Form */}
              <form id="order-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Mode Selector - iOS Segmented Control */}
                <div>
                  <label className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-2">
                    Mode de réception
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/60">
                    <button
                      type="button"
                      onClick={() => setMode('delivery')}
                      className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                        mode === 'delivery'
                          ? 'bg-white text-orange-600 shadow-sm font-extrabold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      <span>🚚 Livraison</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('pickup')}
                      className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                        mode === 'pickup'
                          ? 'bg-white text-orange-600 shadow-sm font-extrabold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>🏪 Retrait sur place</span>
                    </button>
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Votre nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Moussa Diop"
                      className="w-full bg-white border border-stone-200 rounded-2xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+221 7X XXX XX XX"
                      className="w-full bg-white border border-stone-200 rounded-2xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-xs"
                    />
                  </div>
                </div>

                {/* Delivery specific fields */}
                {mode === 'delivery' ? (
                  <div className="space-y-3 bg-white/70 p-3.5 rounded-2xl border border-stone-200/80 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Quartier (Saint-Louis) *
                        </label>
                        <input
                          type="text"
                          required
                          value={quartier}
                          onChange={(e) => setQuartier(e.target.value)}
                          placeholder="Ex: Ngallel, Sor, Bango..."
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Adresse / Rue
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Ex: Villa 12, côté pharmacie"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Indications pour le livreur
                      </label>
                      <input
                        type="text"
                        value={indications}
                        onChange={(e) => setIndications(e.target.value)}
                        placeholder="Ex: Deuxième maison après la boutique blanche"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/70 p-3.5 rounded-2xl border border-stone-200/80 shadow-xs">
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Heure de retrait souhaitée
                    </label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      placeholder="Ex: Dans 30 minutes, ou vers 19h30"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-[11px] text-stone-500 mt-1.5">
                      📍 Adresse : Saint-Louis, Ngallel, côté DSCOS
                    </p>
                  </div>
                )}

                {/* Additional notes */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Remarques ou préférences (facultatif)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Sauce pimentée bien relevée à part..."
                    className="w-full bg-white border border-stone-200 rounded-2xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Error message banner */}
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200/80 bg-white/90 safe-bottom">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-stone-500 font-bold">Paiement :</span>
              <span className="text-orange-600 font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Espèces {mode === 'delivery' ? 'à la livraison' : 'au retrait'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-stone-200/60">
              <span className="text-base font-black text-stone-900">TOTAL :</span>
              <span className="text-2xl font-black text-orange-600 tracking-tight">
                {totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <button
              type="submit"
              form="order-form"
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-2xl btn-liquid-orange font-black text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Envoi vers Chez Bineta...</span>
                </>
              ) : (
                <>
                  <span>PASSER LA COMMANDE</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
