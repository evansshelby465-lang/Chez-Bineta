import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Store,
  Bike,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  MapPin,
  Clock,
  Check,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../services/orderService';
import { Order } from '../types';
import { RESTAURANT_INFO } from '../data/initialCatalog';
import { saveRecentOrder } from '../utils/recentOrders';

interface CartViewProps {
  onOrderSuccess: (order: Order) => void;
  onNavigateToMenu?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

const POPULAR_QUARTIERS = [
  'Ngallel',
  'Sor',
  'Bango',
  'Escale',
  'Ndar Toute',
  'Balacos',
  'Pikine',
  'Khor',
];

const QUICK_PICKUP_TIMES = [
  'Au plus vite (~20 min)',
  'Dans 30 min',
  'Dans 45 min',
  'Dans 1 heure',
];

export const CartView: React.FC<CartViewProps> = ({
  onOrderSuccess,
  onNavigateToMenu,
  isModal = false,
  onCloseModal,
}) => {
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItemsCount } = useCart();

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRemoveWithFeedback = (productId: string, variant?: string) => {
    const key = `${productId}-${variant || 'none'}`;
    setDeletingId(key);
    setTimeout(() => {
      removeItem(productId, variant);
      setDeletingId(null);
    }, 180);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    // Form validations
    if (!customerName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMessage('Veuillez renseigner un numéro de téléphone joignable (ex: +221 77 123 45 67).');
      return;
    }
    if (mode === 'delivery') {
      if (!quartier.trim()) {
        setErrorMessage('Pour la livraison, veuillez préciser votre quartier à Saint-Louis.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const order = await placeOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        mode,
        pickupTime: mode === 'pickup' ? pickupTime.trim() || 'Au plus vite' : undefined,
        address: mode === 'delivery' ? address.trim() : undefined,
        quartier: mode === 'delivery' ? quartier.trim() : undefined,
        indications: mode === 'delivery' ? indications.trim() : undefined,
        rawItems: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variant: i.variant,
        })),
        notes: notes.trim() || undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6b00', '#ffa020', '#10b981', '#ffffff'],
        });
      } catch {
        // Safe catch
      }

      // Save order to customer local storage for instant re-tracking
      saveRecentOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        mode: order.mode,
        createdAt: order.createdAt,
        status: order.status,
      });

      clearCart();
      if (onCloseModal) onCloseModal();
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

  if (items.length === 0) {
    return (
      <div className="py-12 sm:py-16 text-center space-y-4 max-w-md mx-auto px-4">
        <div className="w-20 h-20 mx-auto rounded-3xl glass-panel-orange flex items-center justify-center text-3xl shadow-sm border border-orange-200">
          🛒
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-stone-900">Votre panier est vide</h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
            Découvrez nos spécialités Chez Bineta : Fatayas dorés à 100 F, Mini Tacos, Mini Pizzas, Nems et Poutines !
          </p>
        </div>
        {onNavigateToMenu && (
          <button
            onClick={onNavigateToMenu}
            className="mt-4 px-6 py-3.5 rounded-2xl btn-liquid-orange font-black text-sm shadow-md transition active:scale-95 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Découvrir le menu</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* 1. CONTENU DU PANIER */}
      {/* ================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-700">
              Contenu du panier ({totalItemsCount} {totalItemsCount > 1 ? 'articles' : 'article'})
            </h3>
          </div>
          <span className="text-xs font-bold text-orange-600">
            {totalAmount.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        <div className="space-y-2.5">
          {items.map((item) => {
            const itemKey = `${item.productId}-${item.variant || 'none'}`;
            const isDeleting = deletingId === itemKey;

            return (
              <div
                key={itemKey}
                className={`glass-panel rounded-3xl p-3.5 sm:p-4 border border-white flex items-center gap-3.5 transition-all duration-200 ${
                  isDeleting ? 'opacity-0 scale-95 -translate-x-2' : 'opacity-100 scale-100'
                }`}
              >
                {/* Product image */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200/60 shadow-xs relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback image
                      (e.target as HTMLImageElement).src = '/images/logo.jpg';
                    }}
                  />
                  {item.productId === 'fataya' && (
                    <span className="absolute bottom-0 inset-x-0 bg-orange-600 text-white text-[9px] font-black text-center py-0.2">
                      100 F
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900 truncate">
                        {item.name}
                      </h4>
                      {item.variant && (
                        <span className="inline-block text-[11px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-lg mt-0.5">
                          {item.variant}
                        </span>
                      )}
                    </div>

                    {/* Delete button (minimum 40x40px touch zone) */}
                    <button
                      type="button"
                      onClick={() => handleRemoveWithFeedback(item.productId, item.variant)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition -mr-1"
                      title="Supprimer l'article"
                      aria-label={`Supprimer ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2.5">
                    {/* Unit price */}
                    <span className="text-xs text-orange-600 font-extrabold tabular-nums">
                      {item.price.toLocaleString('fr-FR')} F / u
                    </span>

                    {/* Quantity Stepper (Ergonomic Android touch targets >= 40px) */}
                    <div className="flex items-center bg-stone-100/90 rounded-2xl p-0.5 border border-stone-200/80 shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity === 1) {
                            handleRemoveWithFeedback(item.productId, item.variant);
                          } else {
                            updateQuantity(item.productId, item.quantity - 1, item.variant);
                          }
                        }}
                        className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-stone-700 hover:text-stone-950 active:scale-90 rounded-xl transition hover:bg-white"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-7 text-center font-black text-xs sm:text-sm text-stone-900 tabular-nums">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                        className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-stone-700 hover:text-stone-950 active:scale-90 rounded-xl transition hover:bg-white"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="text-xs sm:text-sm font-black text-stone-900 tabular-nums min-w-[50px] text-right">
                      {item.lineTotal.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Order Form */}
      <form id="order-form-main" onSubmit={handleSubmit} className="space-y-6">
        {/* ================================================== */}
        {/* 2. FORMULAIRE CLIENT */}
        {/* ================================================== */}
        <section className="glass-panel rounded-[32px] p-5 sm:p-6 border border-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
              1
            </span>
            <h3 className="text-sm font-black text-stone-900">
              Vos Coordonnées
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Nom complet <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Moussa Diop"
                className="w-full bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Téléphone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +221 77 123 45 67"
                className="w-full bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition font-mono"
              />
            </div>
          </div>
          <p className="text-[11px] text-stone-500">
            📞 Bineta vous contactera directement sur ce numéro si besoin pour valider votre commande.
          </p>
        </section>

        {/* ================================================== */}
        {/* 3. INFORMATIONS DE LIVRAISON */}
        {/* ================================================== */}
        <section className="glass-panel rounded-[32px] p-5 sm:p-6 border border-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
              2
            </span>
            <h3 className="text-sm font-black text-stone-900">
              Mode de réception & Lieu
            </h3>
          </div>

          {/* Segmented Control iOS / Android */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200/70">
            <button
              type="button"
              onClick={() => setMode('delivery')}
              className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-black transition-all active:scale-98 ${
                mode === 'delivery'
                  ? 'bg-white text-orange-600 shadow-[0_4px_12px_rgba(255,107,0,0.15)] border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>🚚 Livraison</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('pickup')}
              className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-black transition-all active:scale-98 ${
                mode === 'pickup'
                  ? 'bg-white text-orange-600 shadow-[0_4px_12px_rgba(255,107,0,0.15)] border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>🏪 Retrait sur place</span>
            </button>
          </div>

          {/* Délai indicatif estimé */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-orange-50/80 border border-orange-200/80 text-orange-950 text-xs font-bold shadow-2xs">
            <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 animate-pulse" />
            <span>
              {mode === 'delivery'
                ? 'Délai indicatif : Livré en ~35 à 45 minutes selon votre quartier.'
                : 'Délai indicatif : Prêt en ~25 à 35 minutes au restaurant.'}
            </span>
          </div>

          {/* Delivery Fields */}
          {mode === 'delivery' ? (
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5">
                  Quartier (Saint-Louis) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                  placeholder="Ex: Ngallel, Sor, Bango..."
                  className="w-full bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition"
                />

                {/* Popular neighborhood chips for rapid 1-tap mobile selection */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-stone-400">Suggestions :</span>
                  {POPULAR_QUARTIERS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuartier(q)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition active:scale-95 ${
                        quartier === q
                          ? 'bg-orange-500 text-white font-extrabold shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5">
                  Adresse exacte / Rue
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Villa 42, près de la grande mosquée"
                  className="w-full bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5">
                  Indications pour le livreur (repères visuels)
                </label>
                <input
                  type="text"
                  value={indications}
                  onChange={(e) => setIndications(e.target.value)}
                  placeholder="Ex: Portail bleu, maison en face de la boutique"
                  className="w-full bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/70 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-orange-900">
                    Adresse de retrait :
                  </h4>
                  <p className="text-xs text-orange-800 font-semibold mt-0.5">
                    {RESTAURANT_INFO.address}
                  </p>
                  <p className="text-[11px] text-orange-700 mt-1">
                    Votre commande sera préparée minute avec soin par Bineta.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5">
                  Heure souhaitée pour récupérer votre commande
                </label>
                <input
                  type="text"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="Ex: Dans 25 minutes ou vers 19h30"
                  className="w-full bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {QUICK_PICKUP_TIMES.map((timeOption) => (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setPickupTime(timeOption)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition active:scale-95 ${
                        pickupTime === timeOption
                          ? 'bg-orange-500 text-white font-extrabold shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                      }`}
                    >
                      {timeOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cooking notes / preferences */}
          <div className="pt-2">
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              Remarques culinaires ou préférences (facultatif)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sauce pimentée bien relevée à part, bien cuit..."
              className="w-full bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition"
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* 4. RÉCAPITULATIF */}
        {/* ================================================== */}
        <section className="glass-panel-elevated rounded-[32px] p-5 sm:p-6 border border-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
              3
            </span>
            <h3 className="text-sm font-black text-stone-900">
              Récapitulatif de la Commande
            </h3>
          </div>

          <div className="space-y-2 text-xs divide-y divide-stone-100">
            <div className="flex justify-between py-1 text-stone-600">
              <span>Articles commandés ({totalItemsCount}) :</span>
              <span className="font-extrabold text-stone-900 tabular-nums">
                {totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="flex justify-between py-2 text-stone-600">
              <span>Mode de réception :</span>
              <span className="font-bold text-stone-900">
                {mode === 'delivery' ? '🚚 Livraison à domicile' : '🏪 Retrait sur place'}
              </span>
            </div>

            <div className="flex justify-between py-2 text-stone-600">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mode de paiement :</span>
              </span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                💵 Espèces {mode === 'delivery' ? 'à la livraison' : 'au retrait'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-3 text-stone-900">
              <span className="text-base font-black">TOTAL À PAYER :</span>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight tabular-nums">
                  {totalAmount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span className="font-bold">{errorMessage}</span>
          </div>
        )}

        {/* ================================================== */}
        {/* 5. BOUTON "PASSER LA COMMANDE" */}
        {/* ================================================== */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="w-full min-h-[54px] py-4 px-6 rounded-2xl btn-liquid-orange font-black text-base tracking-wide flex items-center justify-center gap-3 shadow-[0_12px_28px_rgba(255,107,0,0.35)] active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
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
          <p className="text-[11px] text-center text-stone-500 font-medium">
            🔒 Commande enregistrée en direct dans Cloud Firestore avec suivi en temps réel.
          </p>
        </div>

        {/* ================================================== */}
        {/* 6. ESPACE DE SÉCURITÉ */}
        {/* ================================================== */}
        {/* Dynamic safe padding zone preventing bottom navigation overlap */}
        <div
          className="h-24 sm:h-20 w-full pointer-events-none select-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
          aria-hidden="true"
        />
      </form>
    </div>
  );
};
