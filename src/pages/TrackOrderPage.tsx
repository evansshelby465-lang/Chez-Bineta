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
  RefreshCw,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus, RecentOrderRecord } from '../types';
import { subscribeToOrder, findOrder } from '../services/orderService';
import { createWhatsAppOrderLink } from '../utils/whatsapp';
import { soundService } from '../utils/notifications';
import {
  getRecentOrders,
  saveRecentOrder,
  updateRecentOrderStatus,
  clearRecentOrders,
  removeRecentOrder,
} from '../utils/recentOrders';

interface TrackOrderPageProps {
  initialOrderId?: string | null;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderId }) => {
  const [searchInput, setSearchInput] = useState(initialOrderId || '');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshRecent = () => {
    setRecentOrders(getRecentOrders());
  };

  useEffect(() => {
    refreshRecent();
  }, []);

  useEffect(() => {
    if (initialOrderId) {
      setSearchInput(initialOrderId);
      subscribeOrderLive(initialOrderId);
    }
  }, [initialOrderId]);

  const cacheOrder = (order: Order) => {
    saveRecentOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      total: order.total,
      mode: order.mode,
      createdAt: order.createdAt,
      status: order.status,
    });
    refreshRecent();
  };

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
          cacheOrder(order);
          return;
        }

        findOrder(targetId)
          .then((found) => {
            if (found) {
              setCurrentOrder(found);
              cacheOrder(found);

              subscribeToOrder(found.id, (liveFound) => {
                if (liveFound) {
                  setCurrentOrder(liveFound);
                  cacheOrder(liveFound);
                }
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

  const handleRecentClick = (order: RecentOrderRecord) => {
    setSearchInput(order.orderNumber);
    subscribeOrderLive(order.id);
  };

  const handleRemoveRecent = (id: string) => {
    removeRecentOrder(id);
    refreshRecent();
  };

  const handleClearRecent = () => {
    clearRecentOrders();
    refreshRecent();
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
          desc: `En route vers ${order.quartier || 'votre adresse'}`,
          icon: Bike,
        },
        {
          key: 'completed',
          label: 'Livrée & Réglée',
          desc: 'Bon appétit chez Chez Bineta ! 😋',
          icon: CheckCircle2,
        },
      ];
    }

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
        desc: 'À retirer sur place (Ngallel, côté DSCOS)',
        icon: Store,
      },
      {
        key: 'completed',
        label: 'Retirée & Réglée',
        desc: 'Merci pour votre confiance !',
        icon: CheckCircle2,
      },
    ];
  };

  const getStepStatus = (stepKey: string, currentStatus: OrderStatus) => {
    const sequenceDelivery: OrderStatus[] = [
      'received',
      'preparing',
      'ready',
      'delivering',
      'completed',
    ];

    const sequencePickup: OrderStatus[] = [
      'received',
      'preparing',
      'ready',
      'completed',
    ];

    const sequence =
      currentOrder?.mode === 'delivery'
        ? sequenceDelivery
        : sequencePickup;

    const currentIndex = sequence.indexOf(currentStatus);
    const stepIndex = sequence.indexOf(stepKey as OrderStatus);

    if (currentStatus === 'cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';

    return 'upcoming';
  };

  const getEstimatedMessage = (order: Order) => {
    if (order.status === 'completed') {
      return 'Commande terminée. Merci pour votre confiance !';
    }

    if (order.status === 'received') {
      return (
        order.estimatedPrepTime ||
        (order.mode === 'pickup' ? 'Environ 25–35 min' : 'Environ 35–45 min')
      );
    }

    if (order.status === 'preparing') {
      return order.estimatedPrepTime || 'Préparation en cours — environ 15–25 min restantes';
    }

    if (order.status === 'ready') {
      return order.mode === 'pickup'
        ? 'Votre commande est prête à récupérer.'
        : 'Votre commande est prête pour la livraison.';
    }

    if (order.status === 'delivering') {
      return 'Votre commande est en route — environ 10–20 min.';
    }

    return null;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28 sm:pb-32">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
          Suivi de <span className="text-orange-600">Commande</span>
        </h1>

        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Suivez l’avancement de votre commande en direct grâce à la
          synchronisation Cloud Firestore.
        </p>
      </div>

      {/* Search */}
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
          className="px-6 py-3 rounded-2xl btn-liquid-orange font-black text-sm shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Suivre</span>
        </button>
      </form>

      {/* Recent orders */}
      {!currentOrder && recentOrders.length > 0 && !isLoading && (
        <div className="glass-panel rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-stone-900">
                Mes commandes récentes
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Retrouver rapidement une commande déjà suivie.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearRecent}
              className="text-[11px] font-bold text-stone-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer
            </button>
          </div>

          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-2 rounded-2xl bg-white/75 border border-stone-200/70 p-3"
              >
                <button
                  type="button"
                  onClick={() => handleRecentClick(order)}
                  className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-black text-sm text-orange-600">
                      {order.orderNumber}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {order.customerName} •{' '}
                      {order.total.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveRecent(order.id)}
                  aria-label={`Supprimer ${order.orderNumber}`}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 glass-panel rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-stone-500 font-medium">
            Interrogation de Cloud Firestore en direct...
          </p>
        </div>
      )}

      {/* Error */}
      {errorMessage && !isLoading && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />

          <div>
            <p className="font-bold">{errorMessage}</p>
            <p className="text-[11px] text-rose-600 mt-0.5">
              Assurez-vous d’avoir renseigné l’identifiant exact généré lors
              de la commande (ex: #CB-1042).
            </p>
          </div>
        </div>
      )}

      {/* Current order */}
      {currentOrder && !isLoading && (
        <div className="glass-panel-elevated rounded-[36px] p-5 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-white space-y-6">
          {/* Header order */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200/80 gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-black text-orange-600 tracking-tight">
                  {currentOrder.orderNumber}
                </span>

                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200/60">
                  {currentOrder.mode === 'delivery'
                    ? '🚚 Livraison'
                    : '🏪 Retrait sur place'}
                </span>
              </div>

              <p className="text-xs text-stone-500 mt-1">
                Client :{' '}
                <strong className="text-stone-800">
                  {currentOrder.customerName}
                </strong>

                {currentOrder.phone && (
                  <>
                    {' • '}
                    <span>{currentOrder.phone}</span>
                  </>
                )}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-stone-500 block font-semibold">
                Total en espèces
              </span>

              <span className="text-xl sm:text-2xl font-black text-stone-900 tabular-nums">
                {currentOrder.total.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Estimated time */}
          {currentOrder.status !== 'cancelled' && getEstimatedMessage(currentOrder) && (
            <div className="p-4 rounded-3xl bg-orange-50 border border-orange-200/80 flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs font-black text-orange-900">
                  Temps estimé
                </p>
                <p className="text-sm font-bold text-orange-700 mt-0.5">
                  {getEstimatedMessage(currentOrder)}
                </p>
              </div>
            </div>
          )}

          {/* Cancellation */}
          {currentOrder.status === 'cancelled' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
              <div className="flex items-center gap-2 font-extrabold text-sm text-rose-700">
                <AlertCircle className="w-5 h-5" />
                <span>❌ COMMANDE REFUSÉE</span>
              </div>

              <p className="text-xs text-rose-700 mt-1">
                Raison indiquée par Bineta :{' '}
                <strong>
                  {currentOrder.rejectionReason ||
                    'Produit indisponible ou restaurant exceptionnellement fermé.'}
                </strong>
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

          {/* Timeline */}
          {currentOrder.status !== 'cancelled' && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-4">
                Statut en direct (Cloud Firestore)
              </h3>

              <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {getTimelineSteps(currentOrder).map((step) => {
                  const state = getStepStatus(
                    step.key,
                    currentOrder.status
                  );

                  const Icon = step.icon;

                  let ringClass =
                    'bg-stone-100 border-stone-300 text-stone-400';
                  let textClass = 'text-stone-400';

                  if (state === 'completed') {
                    ringClass =
                      'bg-emerald-500 border-emerald-400 text-white shadow-sm';
                    textClass = 'text-stone-700';
                  } else if (state === 'active') {
                    ringClass =
                      'bg-orange-500 border-orange-300 text-white ring-4 ring-orange-500/20 animate-pulse';
                    textClass = 'text-orange-600 font-extrabold';
                  }

                  return (
                    <div
                      key={step.key}
                      className="relative flex items-start gap-3.5"
                    >
                      <div
                        className={`absolute -left-8 mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${ringClass}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-xs sm:text-sm font-extrabold ${textClass}`}
                        >
                          {step.label}

                          {state === 'active' && (
                            <span className="ml-2 inline-block text-[10px] uppercase tracking-wide bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black border border-orange-200">
                              En cours
                            </span>
                          )}
                        </h4>

                        <p className="text-xs text-stone-500 mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WhatsApp — keep acceptance gate */}
          {currentOrder.status !== 'received' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div>
                <p className="text-xs font-black text-emerald-900">
                  {currentOrder.status === 'preparing'
                    ? '🟢 Votre commande a été acceptée et est en préparation.'
                    : 'Besoin d’échanger avec Bineta ?'}
                </p>

                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Ouvrez directement la conversation WhatsApp avec le message
                  pré-rempli.
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

          {/* Items */}
          <div className="pt-4 border-t border-stone-200/80">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
              Articles commandés
            </h4>

            <div className="space-y-2 bg-white/70 p-3.5 rounded-2xl border border-stone-200/60">
              {currentOrder.items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex justify-between gap-3 text-xs py-1 border-b border-stone-100 last:border-none"
                >
                  <span className="text-stone-800 font-semibold">
                    {it.name}{' '}
                    {it.variant ? `(${it.variant})` : ''} ×{' '}
                    <strong className="text-orange-600 font-black">
                      {it.quantity}
                    </strong>
                  </span>

                  <span className="font-extrabold text-stone-900 whitespace-nowrap tabular-nums">
                    {it.lineTotal.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment */}
          <div className="p-4 bg-white/80 rounded-2xl text-xs space-y-1.5 text-stone-600 border border-stone-200/70">
            {currentOrder.mode === 'delivery' ? (
              <>
                <p>
                  📍 <strong>Quartier :</strong>{' '}
                  {currentOrder.quartier || 'Non renseigné'}
                </p>

                {currentOrder.address && (
                  <p>
                    🏠 <strong>Adresse :</strong> {currentOrder.address}
                  </p>
                )}

                {currentOrder.indications && (
                  <p>
                    🧭 <strong>Indications :</strong>{' '}
                    {currentOrder.indications}
                  </p>
                )}
              </>
            ) : (
              <p>
                🏪 <strong>Retrait :</strong> Chez Bineta (Ngallel, côté
                DSCOS) • Heure :{' '}
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

      {/* Guide */}
      {!searched && !currentOrder && recentOrders.length === 0 && (
        <div className="p-8 rounded-[36px] glass-panel text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
            📦
          </div>

          <h3 className="text-base font-extrabold text-stone-900">
            Suivi temps réel transparent
          </h3>

          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Dès que vous passez une commande, votre numéro #CB-XXXX vous
            permet de suivre chaque étape de préparation et de livraison en
            direct.
          </p>
        </div>
      )}
    </div>
  );
};
