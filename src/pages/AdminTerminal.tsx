import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Bell,
  Clock,
  Package,
  Bike,
  CheckCircle,
  XCircle,
  Trash2,
  Phone,
  MessageSquare,
  AlertTriangle,
  Settings,
  Plus,
  Edit2,
  Calendar,
  LogOut,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, Product, Reservation, StoreStatus } from '../types';
import {
  subscribeToAllOrders,
  updateOrderStatus,
  deleteOrder,
} from '../services/orderService';
import {
  updateProduct,
  toggleProductAvailability,
  addProduct,
  deleteProduct,
} from '../services/productService';
import {
  subscribeToReservations,
  updateReservationStatus,
  deleteReservation,
} from '../services/reservationService';
import { updateStoreStatus } from '../services/storeStatusService';
import { triggerNewOrderNotification, requestNotificationPermission } from '../utils/notifications';
import { createWhatsAppOrderLink } from '../utils/whatsapp';

interface AdminTerminalProps {
  products: Product[];
  storeStatus: StoreStatus;
}

export const AdminTerminal: React.FC<AdminTerminalProps> = ({
  products,
  storeStatus,
}) => {
  const { currentUser, isAdmin, signInWithGoogle, managerLogout } = useAuth();


  const [adminTab, setAdminTab] = useState<'orders' | 'history' | 'products' | 'reservations' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState<'all' | 'received' | 'preparing' | 'ready' | 'delivering'>('all');

  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Produit temporairement indisponible');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState<Partial<Product>>({});

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // 1. Subscribe to Orders in real-time
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToAllOrders(
      (newOrders) => {
        // Trigger alert on new incoming orders
        if (!initialLoadRef.current) {
          newOrders.forEach((o) => {
            if (!knownOrderIdsRef.current.has(o.id) && o.status === 'received') {
              triggerNewOrderNotification(o.orderNumber, o.customerName, o.total);
            }
          });
        } else {
          initialLoadRef.current = false;
        }

        knownOrderIdsRef.current = new Set(newOrders.map((o) => o.id));
        setOrders(newOrders);
      },
      (error) => {
        console.error('Terminal orders sync error:', error);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // 2. Subscribe to Sunday Reservations in real-time
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeToReservations((resList) => {
      setReservations(resList);
    });
    return () => unsub();
  }, [isAdmin]);


  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'preparing');
    } catch {
      alert('Erreur lors de l’acceptation');
    }
  };

  const handleConfirmRefuse = async () => {
    if (!rejectingOrder) return;
    try {
      await updateOrderStatus(rejectingOrder.id, 'cancelled', rejectionReason);
      setRejectingOrder(null);
    } catch {
      alert('Erreur lors du refus de la commande');
    }
  };

  const handleAdvanceStatus = async (order: Order, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(order.id, nextStatus);
    } catch {
      alert('Erreur de mise à jour du statut');
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (window.confirm(`Supprimer définitivement la commande ${orderNumber} de Firestore ?`)) {
      try {
        await deleteOrder(orderId);
      } catch {
        alert('Erreur de suppression dans Firestore');
      }
    }
  };

  // Stats
  const countReceived = orders.filter((o) => o.status === 'received').length;
  const countPreparing = orders.filter((o) => o.status === 'preparing').length;
  const countReady = orders.filter((o) => o.status === 'ready').length;
  const countDelivering = orders.filter((o) => o.status === 'delivering').length;
  const countCompleted = orders.filter((o) => o.status === 'completed').length;

  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  const activeOrders = orders.filter((o) => {
    if (statusFilter === 'all') {
      return ['received', 'preparing', 'ready', 'delivering'].includes(o.status);
    }
    return o.status === statusFilter;
  });

  const historyOrders = orders.filter((o) =>
    ['completed', 'cancelled'].includes(o.status)
  );

  // If not logged in
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="glass-panel-elevated rounded-[36px] p-6 sm:p-8 text-center space-y-5 border border-white">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center mx-auto text-3xl shadow-sm">
            👩🏾‍🍳
          </div>

          <div>
            <h1 className="text-2xl font-black text-stone-900">Terminal Gérante</h1>
            <p className="text-xs text-orange-600 font-bold mt-1">
              Espace de gestion des commandes Chez Bineta
            </p>
          </div>

          <button
            onClick={() => signInWithGoogle()}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 border border-stone-200/80 shadow-xs transition active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Connexion Google (Bineta)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Terminal Header */}
      <div className="glass-panel-elevated rounded-[36px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl btn-liquid-orange font-bold shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900">
                Terminal Chez Bineta
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firestore Live
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Synchronisation temps réel active • {currentUser?.email || 'Mode Tablette Cuisine'}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              triggerNewOrderNotification('#TEST', 'Test Notification', 1000);
            }}
            className="px-3.5 py-2 rounded-2xl glass-panel hover:bg-white text-stone-700 font-bold text-xs flex items-center gap-1.5 border border-stone-200 shadow-xs transition active:scale-95"
            title="Tester le son et la vibration"
          >
            <Volume2 className="w-4 h-4 text-orange-500" />
            <span>Tester Son</span>
          </button>

          <button
            onClick={() => managerLogout()}
            className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 border border-rose-200 shadow-xs transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS (Prompt Requirement 15) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="glass-panel p-4 rounded-3xl flex flex-col justify-between border border-white">
          <span className="text-xs text-stone-500 font-bold">Total Commandes</span>
          <span className="text-2xl font-black text-stone-900 mt-1">{orders.length}</span>
        </div>

        <div className="glass-panel-orange p-4 rounded-3xl flex flex-col justify-between border border-orange-200/80">
          <span className="text-xs text-orange-700 font-extrabold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            En attente
          </span>
          <span className="text-2xl font-black text-orange-600 mt-1">{countReceived}</span>
        </div>

        <div className="glass-panel p-4 rounded-3xl flex flex-col justify-between border border-yellow-200 bg-yellow-50/50">
          <span className="text-xs text-yellow-800 font-bold">🟡 En préparation</span>
          <span className="text-2xl font-black text-yellow-700 mt-1">{countPreparing}</span>
        </div>

        <div className="glass-panel p-4 rounded-3xl flex flex-col justify-between border border-blue-200 bg-blue-50/50">
          <span className="text-xs text-blue-800 font-bold">🔵 Prêtes</span>
          <span className="text-2xl font-black text-blue-700 mt-1">{countReady}</span>
        </div>

        <div className="glass-panel p-4 rounded-3xl flex flex-col justify-between border border-purple-200 bg-purple-50/50">
          <span className="text-xs text-purple-800 font-bold">🚚 En livraison</span>
          <span className="text-2xl font-black text-purple-700 mt-1">{countDelivering}</span>
        </div>

        <div className="glass-panel p-4 rounded-3xl flex flex-col justify-between border border-emerald-200 bg-emerald-50/50">
          <span className="text-xs text-emerald-800 font-bold">✅ Terminées</span>
          <span className="text-2xl font-black text-emerald-700 mt-1">{countCompleted}</span>
        </div>
      </div>

      {/* Main Terminal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        <button
          onClick={() => setAdminTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition whitespace-nowrap active:scale-95 ${
            adminTab === 'orders'
              ? 'btn-liquid-orange shadow-md'
              : 'glass-panel text-stone-600 hover:text-stone-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Commandes En Cours</span>
          {countReceived > 0 && (
            <span className="bg-white text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-xs">
              {countReceived}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition whitespace-nowrap active:scale-95 ${
            adminTab === 'history'
              ? 'btn-liquid-orange shadow-md'
              : 'glass-panel text-stone-600 hover:text-stone-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Historique ({historyOrders.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition whitespace-nowrap active:scale-95 ${
            adminTab === 'products'
              ? 'btn-liquid-orange shadow-md'
              : 'glass-panel text-stone-600 hover:text-stone-900'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Produits & Disponibilités</span>
        </button>

        <button
          onClick={() => setAdminTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition whitespace-nowrap active:scale-95 ${
            adminTab === 'reservations'
              ? 'btn-liquid-orange shadow-md'
              : 'glass-panel text-stone-600 hover:text-stone-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Dimanche ({reservations.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition whitespace-nowrap active:scale-95 ${
            adminTab === 'settings'
              ? 'btn-liquid-orange shadow-md'
              : 'glass-panel text-stone-600 hover:text-stone-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres</span>
        </button>
      </div>

      {/* TAB 1: ORDERS EN COURS */}
      {adminTab === 'orders' && (
        <div className="space-y-4">
          {/* Subfilter pills */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl border transition ${
                statusFilter === 'all'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-xs'
                  : 'glass-panel text-stone-600 border-white'
              }`}
            >
              Tous ({activeOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('received')}
              className={`px-3 py-1.5 rounded-xl border transition ${
                statusFilter === 'received'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-xs'
                  : 'glass-panel text-stone-600 border-white'
              }`}
            >
              🟠 Nouvelles ({countReceived})
            </button>
            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-3 py-1.5 rounded-xl border transition ${
                statusFilter === 'preparing'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-xs'
                  : 'glass-panel text-stone-600 border-white'
              }`}
            >
              🟡 En préparation ({countPreparing})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-xl border transition ${
                statusFilter === 'ready'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-xs'
                  : 'glass-panel text-stone-600 border-white'
              }`}
            >
              🔵 Prêtes ({countReady})
            </button>
            <button
              onClick={() => setStatusFilter('delivering')}
              className={`px-3 py-1.5 rounded-xl border transition ${
                statusFilter === 'delivering'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-xs'
                  : 'glass-panel text-stone-600 border-white'
              }`}
            >
              🟣 En livraison ({countDelivering})
            </button>
          </div>

          {/* Orders Cards Grid */}
          {activeOrders.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl">
              <div className="w-14 h-14 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2 text-2xl shadow-xs">
                🛎️
              </div>
              <p className="text-stone-800 font-extrabold">Aucune commande en attente pour ce filtre</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Dès qu'un client passe commande, elle apparaîtra automatiquement ici en temps réel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((order) => {
                const isNew = order.status === 'received';

                return (
                  <div
                    key={order.id}
                    className={`glass-panel-elevated rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all border ${
                      isNew
                        ? 'border-orange-400 ring-4 ring-orange-500/20 bg-orange-50/20 animate-fadeIn'
                        : 'border-white'
                    }`}
                  >
                    <div>
                      {/* Top order header */}
                      <div className="flex items-start justify-between pb-3 border-b border-stone-200/80">
                        <div>
                          <div className="flex items-center gap-2">
                            {isNew && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-500 text-white shadow-xs animate-pulse">
                                🔔 NOUVELLE COMMANDE
                              </span>
                            )}
                            <span className="text-lg font-black text-orange-600">
                              {order.orderNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-600 mt-1">
                            <span className="font-extrabold text-stone-900">👤 {order.customerName}</span>
                            <span>•</span>
                            <a
                              href={`tel:${order.phone}`}
                              className="text-orange-600 hover:underline flex items-center gap-1 font-mono font-bold"
                            >
                              <Phone className="w-3 h-3" />
                              {order.phone}
                            </a>
                          </div>
                        </div>

                        {/* Mode badge */}
                        <div className="text-right">
                          <span
                            className={`inline-block text-[11px] font-black px-3 py-1 rounded-full border ${
                              order.mode === 'delivery'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {order.mode === 'delivery' ? '🚚 Livraison' : '🏪 Retrait'}
                          </span>
                          <span className="block text-[10px] text-stone-400 font-bold mt-1">
                            {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-3 space-y-1.5 border-b border-stone-200/80 text-xs">
                        <span className="text-[10px] uppercase tracking-wider font-black text-stone-400">
                          Articles
                        </span>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-stone-800">
                            <span>
                              <strong>{it.name}</strong> {it.variant ? `(${it.variant})` : ''} ×{' '}
                              <span className="text-orange-600 font-black">{it.quantity}</span>
                            </span>
                            <span className="text-stone-500 font-mono font-bold">
                              {it.lineTotal.toLocaleString('fr-FR')} F
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Fulfillment Details */}
                      <div className="py-2.5 text-xs text-stone-600 space-y-1">
                        {order.mode === 'delivery' ? (
                          <>
                            <p>
                              📍 <strong>Quartier :</strong> {order.quartier || 'Non précisé'}
                            </p>
                            {order.address && (
                              <p>
                                🏠 <strong>Adresse :</strong> {order.address}
                              </p>
                            )}
                            {order.indications && (
                              <p className="text-orange-700 italic font-medium">
                                🧭 "{order.indications}"
                              </p>
                            )}
                          </>
                        ) : (
                          <p>
                            🏪 <strong>Retrait :</strong> Heure souhaitée :{' '}
                            <span className="text-orange-600 font-black">
                              {order.pickupTime || 'Au plus vite'}
                            </span>
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-xs text-stone-500 italic">
                            📝 {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Total & Payment */}
                      <div className="flex items-center justify-between py-2 border-t border-stone-200/80 text-xs">
                        <span className="text-stone-500 font-bold">
                          💵 Espèces {order.mode === 'delivery' ? 'à la livraison' : 'au retrait'}
                        </span>
                        <span className="text-lg font-black text-stone-900">
                          {order.total.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>

                    {/* Actions Workflow Buttons */}
                    <div className="pt-3 border-t border-stone-200/80 flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <a
                          href={createWhatsAppOrderLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition shadow-xs"
                          title="WhatsApp avec le client"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                          className="p-2.5 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 transition"
                          title="Supprimer la commande"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Status advancement buttons */}
                      <div className="flex items-center gap-2">
                        {order.status === 'received' && (
                          <>
                            <button
                              onClick={() => setRejectingOrder(order)}
                              className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition active:scale-95 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Refuser</span>
                            </button>

                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="px-5 py-2.5 rounded-2xl btn-liquid-orange font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>ACCEPTER</span>
                            </button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleAdvanceStatus(order, 'ready')}
                            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
                          >
                            <Package className="w-4 h-4" />
                            <span>MARQUER PRÊTE</span>
                          </button>
                        )}

                        {order.status === 'ready' && order.mode === 'delivery' && (
                          <button
                            onClick={() => handleAdvanceStatus(order, 'delivering')}
                            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
                          >
                            <Bike className="w-4 h-4" />
                            <span>DÉPART LIVRAISON</span>
                          </button>
                        )}

                        {(order.status === 'delivering' || (order.status === 'ready' && order.mode === 'pickup')) && (
                          <button
                            onClick={() => handleAdvanceStatus(order, 'completed')}
                            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>TERMINER & PAYÉ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORIQUE */}
      {adminTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-stone-900">
              Historique des commandes
            </h2>
            <div className="text-right">
              <span className="text-xs text-stone-500 block font-semibold">Chiffre d’affaires total :</span>
              <span className="text-xl font-black text-orange-600">
                {totalRevenue.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {historyOrders.length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-3xl">
                <p className="text-stone-500 text-sm font-semibold">Aucune commande archivée pour le moment.</p>
              </div>
            ) : (
              historyOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="glass-panel p-4 rounded-3xl border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-orange-600">{ord.orderNumber}</span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          ord.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ord.status === 'completed' ? '✅ Terminée' : '❌ Refusée'}
                      </span>
                      <span className="text-stone-400">
                        {new Date(ord.createdAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(ord.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-stone-700 mt-1 font-medium">
                      <strong>{ord.customerName}</strong> ({ord.phone}) •{' '}
                      {ord.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                    </p>
                    {ord.rejectionReason && (
                      <p className="text-rose-600 text-[11px] mt-0.5 font-bold">
                        Raison refus : {ord.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-stone-900">
                      {ord.total.toLocaleString('fr-FR')} FCFA
                    </span>

                    <button
                      onClick={() => handleDeleteOrder(ord.id, ord.orderNumber)}
                      className="p-2 rounded-xl bg-stone-100 text-stone-400 hover:text-rose-600 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUITS */}
      {adminTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900">Catalogue des Délices</h2>
              <p className="text-xs text-stone-500">
                Activez/désactivez la disponibilité ou modifiez les prix en direct.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductFormData({
                  id: `prod-${Date.now()}`,
                  name: '',
                  category: 'tacos',
                  price: 500,
                  description: '',
                  imageUrl: '/images/mini_tacos_1790708644401.webp',
                  isAvailable: true,
                  order: products.length + 1,
                });
                setIsAddingProduct(true);
              }}
              className="px-4 py-2.5 rounded-2xl btn-liquid-orange font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Produit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => {
              const isFataya = p.id === 'fataya';

              return (
                <div
                  key={p.id}
                  className="glass-panel rounded-3xl p-4 flex flex-col justify-between space-y-3 border border-white"
                >
                  <div className="flex items-start gap-3">
                    <img
                          loading="lazy"
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-16 h-16 object-cover rounded-2xl bg-stone-100 flex-shrink-0 border border-stone-200/50"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-stone-900 truncate">
                        {p.name}
                      </h4>
                      <span className="text-xs font-black text-orange-600 block mt-0.5">
                        {p.price.toLocaleString('fr-FR')} FCFA
                        {isFataya && ' (Strict 100 F)'}
                      </span>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await toggleProductAvailability(p.id, !p.isAvailable);
                        } catch {
                          alert('Erreur lors du changement de disponibilité');
                        }
                      }}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition ${
                        p.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {p.isAvailable ? '🟢 Disponible' : '🔴 Indisponible'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setProductFormData({ ...p });
                        }}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!['fataya', 'mini-tacos', 'mini-pizza', 'nems', 'poutine'].includes(p.id) && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Supprimer ${p.name} ?`)) {
                              await deleteProduct(p.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RÉSERVATIONS DU DIMANCHE */}
      {adminTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900">Réservations du Dimanche</h2>
              <p className="text-xs text-stone-500">
                Consultez et validez les commandes passées à l’avance pour le dimanche.
              </p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              {reservations.length} demandes
            </span>
          </div>

          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-3xl">
                <p className="text-stone-500 text-sm font-semibold">
                  Aucune réservation pour le moment.
                </p>
              </div>
            ) : (
              reservations.map((res) => (
                <div
                  key={res.id}
                  className="glass-panel rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-orange-600">{res.id}</span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          res.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status === 'refused'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {res.status === 'accepted'
                          ? '✅ Confirmée'
                          : res.status === 'refused'
                          ? '❌ Refusée'
                          : '🟠 En attente'}
                      </span>
                      <span className="text-stone-500 font-bold">
                        🗓️ {res.date} à {res.desiredTime}
                      </span>
                    </div>

                    <p className="text-stone-800">
                      👤 <strong>{res.customerName}</strong> • 📞 {res.phone} •{' '}
                      {res.mode === 'delivery'
                        ? `🚚 Livraison (${res.quartier || ''} ${res.address || ''})`
                        : '🏪 Retrait sur place'}
                    </p>

                    <div className="text-orange-700 font-bold">
                      🍽️ Articles :{' '}
                      {res.items
                        .map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.quantity}`)
                        .join(', ')}
                    </div>

                    {res.notes && <p className="text-stone-500 italic">Note : {res.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {res.status === 'pending' && (
                      <>
                        <button
                          onClick={async () => {
                            await updateReservationStatus(res.id, 'accepted');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={async () => {
                            await updateReservationStatus(res.id, 'refused');
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-xs transition"
                        >
                          Refuser
                        </button>
                      </>
                    )}

                    <button
                      onClick={async () => {
                        if (window.confirm('Supprimer cette réservation ?')) {
                          await deleteReservation(res.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-stone-100 text-stone-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PARAMÈTRES DU RESTAURANT */}
      {adminTab === 'settings' && (
        <div className="glass-panel-elevated rounded-[36px] p-6 space-y-6 max-w-xl border border-white">
          <div>
            <h2 className="text-lg font-black text-stone-900">Paramètres Opérationnels</h2>
            <p className="text-xs text-stone-500">
              Contrôlez l'ouverture et le mode réservation en temps réel.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-stone-200/80 shadow-xs">
            <div>
              <span className="text-sm font-black text-stone-900 block">
                État du restaurant
              </span>
              <span className="text-xs text-stone-500">
                {storeStatus.isOpen ? 'Actuellement ouvert aux commandes' : 'Actuellement fermé'}
              </span>
            </div>
            <button
              onClick={async () => {
                await updateStoreStatus({ isOpen: !storeStatus.isOpen });
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs transition ${
                storeStatus.isOpen
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {storeStatus.isOpen ? '🟢 OUVERT' : '🔴 FERMÉ'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-stone-200/80 shadow-xs">
            <div>
              <span className="text-sm font-black text-stone-900 block">
                Mode Réservation Dimanche
              </span>
              <span className="text-xs text-stone-500">
                Active le bandeau spécial dimanche et le formulaire de précommande
              </span>
            </div>
            <button
              onClick={async () => {
                await updateStoreStatus({ isSundayMode: !storeStatus.isSundayMode });
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs transition ${
                storeStatus.isSundayMode
                  ? 'btn-liquid-orange shadow-xs'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {storeStatus.isSundayMode ? '🟠 ACTIF' : '⚪ DÉSACTIVÉ'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              Message d’annonce (Accueil)
            </label>
            <input
              type="text"
              defaultValue={storeStatus.bannerNotice || ''}
              onBlur={async (e) => {
                await updateStoreStatus({ bannerNotice: e.target.value.trim() });
              }}
              placeholder="Ex: Bienvenue Chez Bineta ! Commandez vos délices dès maintenant."
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500"
            />
            <span className="text-[11px] text-stone-400 block">
              Enregistré automatiquement lorsque vous quittez le champ.
            </span>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
          <div className="w-full max-w-sm glass-panel-elevated rounded-3xl p-5 space-y-4 border border-white">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-black text-base">Refuser la commande</h3>
            </div>

            <p className="text-xs text-stone-700">
              Commande : <strong>{rejectingOrder.orderNumber}</strong> ({rejectingOrder.customerName})
            </p>

            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1">
                Motif du refus (visible par le client) :
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-500"
              >
                <option value="Produit temporairement indisponible">
                  Produit temporairement indisponible
                </option>
                <option value="Restaurant exceptionnellement fermé">
                  Restaurant exceptionnellement fermé
                </option>
                <option value="Impossibilité de livrer dans cette zone">
                  Impossibilité de livrer dans cette zone
                </option>
                <option value="Rupture de stock pour ce soir">
                  Rupture de stock pour ce soir
                </option>
                <option value="Autre raison">Autre raison</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRefuse}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT EDIT / ADD MODAL */}
      {(editingProduct || isAddingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-white">
            <h3 className="font-black text-base text-stone-900">
              {isAddingProduct ? 'Ajouter un nouveau produit' : `Modifier ${editingProduct?.name}`}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-600 font-bold block mb-1">Nom du produit</label>
                <input
                  type="text"
                  value={productFormData.name || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>

              <div>
                <label className="text-stone-600 font-bold block mb-1">Prix en FCFA</label>
                <input
                  type="number"
                  disabled={editingProduct?.id === 'fataya'}
                  value={editingProduct?.id === 'fataya' ? 100 : productFormData.price || 0}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, price: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-900 disabled:opacity-50"
                />
                {editingProduct?.id === 'fataya' && (
                  <span className="text-[10px] text-orange-600 font-bold mt-1 block">
                    ⚠️ Le prix du Fataya est strictement fixé à 100 FCFA.
                  </span>
                )}
              </div>

              <div>
                <label className="text-stone-600 font-bold block mb-1">Description</label>
                <textarea
                  value={productFormData.description || ''}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>

              <div>
                <label className="text-stone-600 font-bold block mb-1">Image URL</label>
                <input
                  type="text"
                  value={productFormData.imageUrl || ''}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, imageUrl: e.target.value })
                  }
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddingProduct(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (isAddingProduct) {
                      await addProduct(productFormData as Product);
                    } else if (editingProduct) {
                      await updateProduct(editingProduct.id, productFormData);
                    }
                    setEditingProduct(null);
                    setIsAddingProduct(false);
                  } catch {
                    alert('Erreur lors de l’enregistrement');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl btn-liquid-orange font-black text-xs shadow"
              >
                Enregistrer dans Firestore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
