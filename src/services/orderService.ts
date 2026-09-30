import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  getDocs,
  limit,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Order, OrderItem, OrderStatus } from '../types';
import { getOfficialCatalogMap } from './productService';

const COLLECTION_NAME = 'orders';
const TRACKING_COLLECTION = 'orderTracking';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

async function hashPhone(phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildTrackingData(
  order: Order,
  phoneHash: string
) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    numericId: order.numericId,
    customerName: order.customerName,
    mode: order.mode,
    pickupTime: order.pickupTime || null,
    items: order.items,
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: order.status,
    rejectionReason: order.rejectionReason || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt || order.createdAt,

    // Le numéro réel n'est JAMAIS stocké dans le document public.
    phoneHash,
  };
}

/**
 * Generate unique human-readable order number.
 */
export async function generateNextOrderNumber(): Promise<{
  orderNumber: string;
  numericId: number;
  docId: string;
}> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('numericId', 'desc'),
      limit(1)
    );

    const snap = await getDocs(q);

    let nextNumeric = 1001;

    if (!snap.empty) {
      const top = snap.docs[0].data() as { numericId?: number };

      if (top.numericId && typeof top.numericId === 'number') {
        nextNumeric = top.numericId + 1;
      }
    } else {
      nextNumeric = Math.floor(1000 + Math.random() * 900);
    }

    return {
      orderNumber: `#CB-${nextNumeric}`,
      numericId: nextNumeric,
      docId: `CB-${nextNumeric}`,
    };
  } catch {
    const fallbackNumeric = Math.floor(1000 + Math.random() * 8999);

    return {
      orderNumber: `#CB-${fallbackNumeric}`,
      numericId: fallbackNumeric,
      docId: `CB-${fallbackNumeric}`,
    };
  }
}

export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  mode: 'pickup' | 'delivery';
  pickupTime?: string;
  address?: string;
  quartier?: string;
  indications?: string;
  rawItems: {
    productId: string;
    quantity: number;
    variant?: string;
  }[];
  notes?: string;
}

/**
 * Create order.
 *
 * orders:
 *   contains the complete private order.
 *
 * orderTracking:
 *   contains only what the customer needs to follow the order.
 *
 * Both documents are written atomically in one batch.
 */
export async function placeOrder(
  input: PlaceOrderInput
): Promise<Order> {
  const {
    docId,
    orderNumber,
    numericId,
  } = await generateNextOrderNumber();

  const catalogMap = await getOfficialCatalogMap();

  if (!input.rawItems || input.rawItems.length === 0) {
    throw new Error(
      'Le panier est vide. Veuillez sélectionner au moins un produit.'
    );
  }

  let calculatedTotal = 0;
  const verifiedItems: OrderItem[] = [];

  for (const raw of input.rawItems) {
    const officialProduct = catalogMap.get(raw.productId);

    if (!officialProduct) {
      throw new Error(
        `Produit introuvable dans le catalogue : ${raw.productId}`
      );
    }

    if (!officialProduct.isAvailable) {
      throw new Error(
        `Le produit "${officialProduct.name}" est temporairement indisponible.`
      );
    }

    let unitPrice = officialProduct.price;

    if (officialProduct.id === 'fataya') {
      unitPrice = 100;
    } else if (officialProduct.id === 'poutine') {
      unitPrice = 3000;

      const normalizedVariant =
        raw.variant?.toLowerCase();

      if (
        !normalizedVariant ||
        !['crevettes', 'viande'].includes(normalizedVariant)
      ) {
        throw new Error(
          'Pour la Poutine, veuillez choisir obligatoirement Crevettes ou Viande.'
        );
      }
    }

    const qty = Math.max(
      1,
      Math.min(100, Math.floor(raw.quantity))
    );

    const lineTotal = unitPrice * qty;
    calculatedTotal += lineTotal;

    verifiedItems.push({
      productId: officialProduct.id,
      name: officialProduct.name,
      price: unitPrice,
      quantity: qty,
      variant: raw.variant,
      lineTotal,
    });
  }

  if (calculatedTotal <= 0) {
    throw new Error('Le total de la commande est invalide.');
  }

  const nowIso = new Date().toISOString();

  const newOrder: Order = {
    id: docId,
    orderNumber,
    numericId,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    mode: input.mode,

    pickupTime:
      input.mode === 'pickup'
        ? (input.pickupTime?.trim() || 'Au plus tôt')
        : undefined,

    address:
      input.mode === 'delivery'
        ? (input.address?.trim() || '')
        : undefined,

    quartier:
      input.mode === 'delivery'
        ? (input.quartier?.trim() || '')
        : undefined,

    indications:
      input.mode === 'delivery'
        ? (input.indications?.trim() || '')
        : undefined,

    items: verifiedItems,
    total: calculatedTotal,
    paymentMethod: 'cash',
    status: 'received',
    createdAt: nowIso,
    updatedAt: nowIso,
    notes: input.notes?.trim() || '',
  };

  const trackingPhoneHash = await hashPhone(newOrder.phone);

  const batch = writeBatch(db);

  batch.set(
    doc(db, COLLECTION_NAME, docId),
    newOrder
  );

  batch.set(
    doc(db, TRACKING_COLLECTION, docId),
    buildTrackingData(newOrder, trackingPhoneHash)
  );

  const path = `${COLLECTION_NAME}/${docId}`;

  try {
    await batch.commit();
    return newOrder;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      path
    );
    throw error;
  }
}

/**
 * Real-time listener for all private orders.
 * Only the manager is allowed to read this collection.
 */
export function subscribeToAllOrders(
  onOrders: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];

      snapshot.forEach((d) => {
        orders.push({
          ...(d.data() as Order),
          id: d.id,
        });
      });

      onOrders(orders);
    },
    (error) => {
      try {
        handleFirestoreError(
          error,
          OperationType.LIST,
          COLLECTION_NAME
        );
      } catch (err) {
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    }
  );
}

/**
 * Real-time listener for the public tracking document.
 *
 * The real customer phone, address and delivery indications
 * are NOT present in orderTracking.
 */
export function subscribeToOrder(
  orderId: string,
  onOrder: (order: Order | null) => void,
  onError?: (err: Error) => void
): () => void {
  const cleanId = orderId
    .replace(/^#/, '')
    .trim();

  const path =
    `${TRACKING_COLLECTION}/${cleanId}`;

  return onSnapshot(
    doc(db, TRACKING_COLLECTION, cleanId),
    (docSnap) => {
      if (!docSnap.exists()) {
        onOrder(null);
        return;
      }

      const data = docSnap.data() as Partial<Order>;

      onOrder({
        ...(data as Order),

        id: docSnap.id,

        // Intentionally masked.
        phone: '••••••••••',
      });
    },
    (error) => {
      try {
        handleFirestoreError(
          error,
          OperationType.GET,
          path
        );
      } catch (err) {
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    }
  );
}

/**
 * Find order by:
 * - order number / document ID
 * - phone number
 *
 * The private orders collection is NEVER queried by clients.
 */
export async function findOrder(
  queryStr: string
): Promise<Order | null> {
  const trimmed = queryStr.trim();
  const cleanId = trimmed.replace(/^#/, '');

  // 1. Direct public tracking lookup.
  try {
    const trackingRef = doc(
      db,
      TRACKING_COLLECTION,
      cleanId
    );

    const snap = await getDoc(trackingRef);

    if (snap.exists()) {
      const data = snap.data() as Partial<Order>;

      return {
        ...(data as Order),
        id: snap.id,
        phone: '••••••••••',
      };
    }
  } catch {
    // Continue with phone lookup.
  }

  // 2. Phone lookup using a one-way SHA-256 hash.
  try {
    const phoneHash = await hashPhone(trimmed);

    const q = query(
      collection(db, TRACKING_COLLECTION),
      where('phoneHash', '==', phoneHash),
      limit(1)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data() as Partial<Order>;

      return {
        ...(data as Order),
        id: d.id,
        phone: '••••••••••',
      };
    }
  } catch (error) {
    console.warn(
      'Recherche commande par téléphone impossible:',
      error
    );
  }

  return null;
}

/**
 * Update status.
 *
 * Private order + public tracking are updated atomically.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  rejectionReason?: string
): Promise<void> {
  const cleanId = orderId
    .replace(/^#/, '')
    .trim();

  const path =
    `${COLLECTION_NAME}/${cleanId}`;

  try {
    const orderRef = doc(
      db,
      COLLECTION_NAME,
      cleanId
    );

    const trackingRef = doc(
      db,
      TRACKING_COLLECTION,
      cleanId
    );

    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error(
        'Commande introuvable.'
      );
    }

    const existingOrder =
      orderSnap.data() as Order;

    const updatedAt =
      new Date().toISOString();

    const updates: Partial<Order> = {
      status,
      updatedAt,
    };

    if (rejectionReason !== undefined) {
      updates.rejectionReason =
        rejectionReason;
    }

    const batch = writeBatch(db);

    batch.update(
      orderRef,
      updates
    );

    const trackingPhoneHash =
      await hashPhone(existingOrder.phone);

    batch.set(
      trackingRef,
      buildTrackingData(
        {
          ...existingOrder,
          ...updates,
          id: cleanId,
        },
        trackingPhoneHash
      ),
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      path
    );
    throw error;
  }
}

/**
 * Delete private order + tracking document atomically.
 */
export async function deleteOrder(
  orderId: string
): Promise<void> {
  const cleanId = orderId
    .replace(/^#/, '')
    .trim();

  const path =
    `${COLLECTION_NAME}/${cleanId}`;

  try {
    const batch = writeBatch(db);

    batch.delete(
      doc(db, COLLECTION_NAME, cleanId)
    );

    batch.delete(
      doc(
        db,
        TRACKING_COLLECTION,
        cleanId
      )
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      path
    );
    throw error;
  }
}
