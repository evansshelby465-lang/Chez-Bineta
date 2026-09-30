import React, { useState } from 'react';
import { X, Calendar, Clock, Bike, Store, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Product, Reservation } from '../types';
import { createWhatsAppReservationLink } from '../utils/whatsapp';

interface SundayReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const SundayReservationModal: React.FC<SundayReservationModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('Prochain Dimanche');
  const [desiredTime, setDesiredTime] = useState('13h00');
  const [mode, setMode] = useState<'delivery' | 'pickup'>('pickup');
  const [address, setAddress] = useState('');
  const [quartier, setQuartier] = useState('');
  const [notes, setNotes] = useState('');

  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [poutineVariant, setPoutineVariant] = useState<string>('Crevettes');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  if (!isOpen) return null;

  const handleQtyChange = (productId: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    const reservedItems = Object.entries(itemQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([prodId, qty]) => {
        const p = products.find((x) => x.id === prodId);
        return {
          productId: prodId,
          name: p ? p.name : prodId,
          quantity: qty,
          variant: prodId === 'poutine' ? poutineVariant : undefined,
        };
      });

    if (reservedItems.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins un article pour votre réservation.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { createReservation } = await import('../services/reservationService');

      const res = await createReservation({
        customerName: customerName.trim(),
        phone: phone.trim(),
        date,
        desiredTime,
        mode,
        address: mode === 'delivery' ? address.trim() : undefined,
        quartier: mode === 'delivery' ? quartier.trim() : undefined,
        items: reservedItems,
        notes: notes.trim(),
      });
      setCreatedReservation(res);
    } catch {
      setErrorMessage('Erreur lors de la réservation sur Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-md p-0 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg glass-panel-elevated sm:rounded-[36px] max-h-[92vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.18)] overflow-hidden border border-white">
        {/* iOS Drag Handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Réservation pour Dimanche
              </h2>
              <p className="text-xs text-stone-500">
                Service spécial sur précommande
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {createdReservation ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-stone-900">
                Demande de réservation enregistrée !
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                Bineta a bien reçu votre demande pour le dimanche. Elle vous contactera sur WhatsApp pour valider la préparation.
              </p>

              <div className="pt-3">
                <a
                  href={createWhatsAppReservationLink(createdReservation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition active:scale-95"
                >
                  <span>Confirmer directement sur WhatsApp</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-stone-500 hover:text-stone-800 font-bold underline"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form id="reservation-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-xs">
                💡 <strong>Conseil :</strong> Les commandes du dimanche sont préparées sur mesure. Indiquez-nous vos quantités souhaitées pour que nous prévoyions les ingrédients frais.
              </div>

              {/* Contact info */}
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
                    placeholder="Ex: Awa Sow"
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

              {/* Time & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Heure souhaitée
                  </label>
                  <input
                    type="text"
                    value={desiredTime}
                    onChange={(e) => setDesiredTime(e.target.value)}
                    placeholder="Ex: 12h30 ou 19h00"
                    className="w-full bg-white border border-stone-200 rounded-2xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'delivery' | 'pickup')}
                    className="w-full bg-white border border-stone-200 rounded-2xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="pickup">🏪 Retrait sur place</option>
                    <option value="delivery">🚚 Livraison</option>
                  </select>
                </div>
              </div>

              {mode === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/70 p-3.5 rounded-2xl border border-stone-200/80 shadow-xs">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Quartier (Saint-Louis)
                    </label>
                    <input
                      type="text"
                      value={quartier}
                      onChange={(e) => setQuartier(e.target.value)}
                      placeholder="Ex: Ngallel, Sor, Bango..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Adresse ou repère
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Près du château d'eau"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Items selection */}
              <div>
                <label className="text-xs font-black text-stone-600 uppercase tracking-wider block mb-2">
                  Articles à réserver :
                </label>
                <div className="space-y-2 bg-white/80 p-3.5 rounded-2xl border border-stone-200/70 shadow-xs">
                  {products.map((prod) => {
                    const qty = itemQuantities[prod.id] || 0;
                    const price = prod.id === 'fataya' ? 100 : prod.price;

                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between py-2 border-b border-stone-100 last:border-none"
                      >
                        <div>
                          <span className="text-xs font-extrabold text-stone-900 block">
                            {prod.name}
                          </span>
                          <span className="text-[11px] text-orange-600 font-extrabold">
                            {price.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, -1)}
                            className="w-7 h-7 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 border border-stone-200/60 active:scale-90"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-black text-xs text-stone-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, 1)}
                            className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 border border-orange-200/60 active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Poutine variant selector if poutine selected */}
                  {(itemQuantities['poutine'] || 0) > 0 && (
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs text-stone-700 font-bold">Variante Poutine :</span>
                      <div className="flex gap-2">
                        {['Crevettes', 'Viande'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setPoutineVariant(v)}
                            className={`text-[11px] px-3 py-1.5 rounded-xl font-bold border transition ${
                              poutineVariant === v
                                ? 'bg-orange-500 text-white border-orange-400'
                                : 'bg-stone-50 text-stone-600 border-stone-200'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Special notes */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Instructions ou précisions
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Servir chaud pour 13h précises..."
                  className="w-full bg-white border border-stone-200 rounded-2xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!createdReservation && (
          <div className="p-4 sm:p-5 border-t border-stone-200/80 bg-white/90 safe-bottom">
            <button
              type="submit"
              form="reservation-form"
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-2xl btn-liquid-orange font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement sur Firestore...</span>
                </>
              ) : (
                <span>ENVOYER LA RÉSERVATION POUR DIMANCHE</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
