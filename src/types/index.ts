export type ProductCategory = 'tacos' | 'pizza' | 'fataya' | 'nems' | 'poutine';

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  order: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  imageUrl: string;
  lineTotal: number;
}

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. #CB-1042
  numericId: number;
  customerName: string;
  phone: string;
  mode: 'pickup' | 'delivery';
  pickupTime?: string;
  address?: string;
  quartier?: string;
  indications?: string;
  items: OrderItem[];
  total: number; // In FCFA
  paymentMethod: 'cash';
  status: OrderStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface RecentOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  mode: 'pickup' | 'delivery';
  createdAt: string;
  status: OrderStatus;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  desiredTime: string;
  mode: 'pickup' | 'delivery';
  address?: string;
  quartier?: string;
  items: {
    productId?: string;
    name: string;
    quantity: number;
    variant?: string;
  }[];
  notes?: string;
  status: 'pending' | 'accepted' | 'refused';
  createdAt: string;
  rejectionReason?: string;
}

export interface StoreStatus {
  isOpen: boolean;
  isSundayMode: boolean;
  bannerNotice?: string;
  updatedAt?: string;
}
