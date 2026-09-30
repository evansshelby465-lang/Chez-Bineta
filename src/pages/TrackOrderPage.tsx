import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  Store,
  AlertCircle,
  MessageSquare,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { subscribeToOrder, findOrder } from '../services/orderService';
import { createWhatsAppOrderLink } from '../utils/whatsapp';
import { soundService } from '../utils/notifications';

interface TrackOrderPageProps {
  initialOrderId?: string | null;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderId }) => {
  const [searchInput, setSearchInput] = useState(initialOrderId || '');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      setSearchInput(initialOrderId);
      subscribeOrderLive(initialOrderId);
    }
  }, [initialOrderId]);

  const subscribeOrderLive = (targetId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSearched(true);

    const unsubscribe = subscribeToOrder(
      targetId,
      (order) => {
        setIsLoading(false);
        if (order) {
          if (currentOrder && currentOrder.status !== order.status) {
            soundService.playStatusUpdateSound();
          }
          setCurrentOrder(order);
        } else {
          findOrder(targetId)
            .then((found) => {
              if (found) {
                setCurrentOrder(found);
                subscribeToOrder(found.id, (liveFound) => {
                  if (liveFound) setCurrentOrder(liveFound);
                });
              } else {
                setCurrentOrder(null);
                setErrorMessage('Aucune commande trouvée avec cet identifiant ou numéro.');
              }
            })
            .catch(() => {
              setCurrentOrder(null);
              setErrorMessage('Erreur lors de la recherche.');
            });
        }
      },
      (err) => {
        setIsLoading(false);
        setErrorMessage('Erreur de connexion à Firestore.');
        console.error(err);
      }
    );

    return unsubscribe;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    subscribeOrderLive(searchInput.trim());
  };

  const getTimelineSteps = (order: Order) => {
    if (order.mode === 'delivery') {
      return [
        {
          key: 'received',
          label: 'Commande reçue',
          desc: 'En attente de confirmation par Bineta',
          icon: Clock,
        },
        {
          key: 'preparing',
          label: 'En préparation',
          desc: 'Bineta prépare vos délices en cuisine',
          icon: ChefHat,
        },
        {
          key: 'ready',
          label: 'Commande prête',
          desc: 'Emballée avec soin pour le départ',
          icon: Package,
        },
        {
          key: 'delivering',
          label: 'En livraison',
          desc: 'En route vers votre adresse',
          icon: Bike,
        },
        {
          key: 'completed',
          label: 'Livrée & Réglée',
          desc: 'Bon appétit chez Chez Bineta ! 😋',
          icon: CheckCircle2,
        },
      ];
    } else {
      return [
        {
          key: 'received',
          label: 'Commande reçue',
          desc: 'En attente de confirmation par Bineta',
          icon: Clock,
        },
        {
          key: 'preparing',
          label: 'En préparation',
          desc: 'En cuisine chez Chez Bineta',
          icon: ChefHat,
        },
        {
          key: 'ready',
          label: 'Prête à récupérer',
          desc: `À retirer sur place (Ngallel, côté DSCOS)`,
          icon: Store,
        },
        {
          key: 'completed',
          label: 'Retirée & Réglée',
          desc: 'Merci pour votre confiance !',
          icon: CheckCircle2,
        },
      ];
    }
  };

  const getStepStatus = (stepKey: string, currentStatus: OrderStatus) => {
    const sequenceDelivery: OrderStatus[] = ['received', 'preparing', 'ready', 'delivering', 'completed'];
    const sequencePickup: OrderStatus[] = ['received', 'preparing', 'ready', 'completed'];

    const sequence = currentOrder?.mode === 'delivery' ? sequenceDelivery : sequencePickup;
    const currentIndex = sequence.indexOf(currentStatus);
    const stepIndex = sequence.indexOf(stepKey as OrderStatus);

    if (currentStatus === 'cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
          Suivi de <span className="text-orange-600">Commande</span>
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Suivez l’avancement de votre commande en direct grâce à la synchronisation Cloud Firestore.
        </p>
      </div>

      {/* Search Bar - iOS Glass Pill */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="N° de commande (#CB-1042) ou téléphone"
            className="w-full glass-panel rounded-2xl pl-10 pr-3.5 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-xs"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-2xl btn-liquid-orange font-black text-sm shadow-md transition active:scale-95 flex items-center gap-1.5"
        >
          <Search className="w-4 h-4" />
          <span>Suivre</span>
        </button>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8 glass-panel rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-stone-500 font-medium">Interrogation de Cloud Firestore en direct...</p>
        </div>
      )}

      {/* Error state */}
      {errorMessage && !isLoading && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div>
            <p className="font-bold">{errorMessage}</p>
            <p className="text-[11px] text-rose-600 mt-0.5">
              Assurez-vous d’avoir renseigné l’identifiant exact généré lors de la commande (ex: #CB-1042).
            </p>
          </div>
        </div>
      )}

      {/* Order Card Display */}
      {currentOrder && !isLoading && (
        <div className="glass-panel-elevated rounded-[36px] p-6 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-white space-y-6">
          {/* Top Order Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200/80 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-orange-600 tracking-tight">
                  {currentOrder.orderNumber}
                </span>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200/60">
                  {currentOrder.mode === 'delivery' ? '🚚 Livraison' : '🏪 Retrait sur place'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Client : <strong className="text-stone-800">{currentOrder.customerName}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-stone-500 block font-semibold">Total en espèces</span>
              <span className="text-xl sm:text-2xl font-black text-stone-900">
                {currentOrder.total.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Cancellation Banner */}
          {currentOrder.status === 'cancelled' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
              <div className="flex items-center gap-2 font-extrabold text-sm text-rose-700">
                <AlertCircle className="w-5 h-5" />
                <span>❌ COMMANDE REFUSÉE</span>
              </div>
              <p className="text-xs text-rose-700 mt-1">
                Raison indiquée par Bineta :{' '}
                <strong>{currentOrder.rejectionReason || 'Produit indisponible ou restaurant exceptionnellement fermé.'}</strong>
              </p>
              <div className="mt-3">
                <a
                  href={createWhatsAppOrderLink(currentOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contacter Bineta sur WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Timeline of Statuses */}
          {currentOrder.status !== 'cancelled' && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-4">
                Statut en direct (Cloud Firestore)
              </h3>

              <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {getTimelineSteps(currentOrder).map((step) => {
                  const state = getStepStatus(step.key, currentOrder.status);
                  const Icon = step.icon;

                  let ringClass = 'bg-stone-100 border-stone-300 text-stone-400';
                  let textClass = 'text-stone-400';

                  if (state === 'completed') {
                    ringClass = 'bg-emerald-500 border-emerald-400 text-white shadow-sm';
                    textClass = 'text-stone-700';
                  } else if (state === 'active') {
                    ringClass = 'bg-orange-500 border-orange-300 text-white ring-4 ring-orange-500/20 animate-pulse';
                    textClass = 'text-orange-600 font-extrabold';
                  }

                  return (
                    <div key={step.key} className="relative flex items-start gap-3.5">
                      <div
                        className={`absolute -left-7 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${ringClass}`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>

                      <div className="flex-1">
                        <h4 className={`text-xs sm:text-sm font-extrabold ${textClass}`}>
                          {step.label}
                          {state === 'active' && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black border border-orange-200">
                              En cours
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WHATSAPP BUTTON (Prompt Requirement 21) */}
          {currentOrder.status !== 'received' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div>
                <p className="text-xs font-black text-emerald-900">
                  {currentOrder.status === 'preparing'
                    ? '🟢 Votre commande a été acceptée et est en préparation.'
                    : 'Besoin d’échanger avec Bineta ?'}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Ouvrez directement la conversation WhatsApp avec le message pré-rempli.
                </p>
              </div>

              <a
                href={createWhatsAppOrderLink(currentOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition active:scale-95 flex-shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>CONTACTER BINETA SUR WHATSAPP</span>
              </a>
            </div>
          )}

          {/* Items Summary */}
          <div className="pt-4 border-t border-stone-200/80">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
              Articles commandés
            </h4>
            <div className="space-y-2 bg-white/70 p-3.5 rounded-2xl border border-stone-200/60">
              {currentOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1 border-b border-stone-100 last:border-none">
                  <span className="text-stone-800 font-semibold">
                    {it.name} {it.variant ? `(${it.variant})` : ''} ×{' '}
                    <strong className="text-orange-600 font-black">{it.quantity}</strong>
                  </span>
                  <span className="font-extrabold text-stone-900">
                    {it.lineTotal.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment details */}
          <div className="p-4 bg-white/80 rounded-2xl text-xs space-y-1.5 text-stone-600 border border-stone-200/70">
            {currentOrder.mode === 'delivery' ? (
              <>
                <p>
                  📍 <strong>Quartier :</strong> {currentOrder.quartier}
                </p>
                {currentOrder.address && (
                  <p>
                    🏠 <strong>Adresse :</strong> {currentOrder.address}
                  </p>
                )}
                {currentOrder.indications && (
                  <p>
                    🧭 <strong>Indications :</strong> {currentOrder.indications}
                  </p>
                )}
              </>
            ) : (
              <p>
                🏪 <strong>Retrait :</strong> Chez Bineta (Ngallel, côté DSCOS) • Heure :{' '}
                {currentOrder.pickupTime || 'Dès que prêt'}
              </p>
            )}
            {currentOrder.notes && (
              <p>
                📝 <strong>Notes :</strong> {currentOrder.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Guide if not searched yet */}
      {!searched && !currentOrder && (
        <div className="p-8 rounded-[36px] glass-panel text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
            📦
          </div>
          <h3 className="text-base font-extrabold text-stone-900">
            Suivi temps réel transparent
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Dès que vous passez une commande, votre numéro #CB-XXXX vous permet de suivre chaque étape de préparation et de livraison en direct.
          </p>
        </div>
      )}
    </div>
  );
};
