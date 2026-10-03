import { OrderStatus, RecentOrderRecord } from '../types';

const STORAGE_KEY = 'cb_customer_recent_orders';

export function getRecentOrders(): RecentOrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Could not read recent orders from storage:', e);
  }
  return [];
}

export function saveRecentOrder(record: RecentOrderRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentOrders();
    // Remove if already exists with same id to push to top
    const filtered = current.filter((o) => o.id !== record.id && o.orderNumber !== record.orderNumber);
    const updated = [record, ...filtered].slice(0, 15); // keep last 15
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save recent order to storage:', e);
  }
}

export function updateRecentOrderStatus(orderId: string, status: OrderStatus): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentOrders();
    const index = current.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index !== -1) {
      current[index].status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn('Could not update status in storage:', e);
  }
}

export function removeRecentOrder(orderId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentOrders();
    const filtered = current.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Could not remove recent order from storage:', e);
  }
}

export function clearRecentOrders(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear recent orders:', e);
  }
}
