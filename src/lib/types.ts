import type { Timestamp } from 'firebase/firestore';

export interface Company {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  companyId: string;
  role: 'superadmin' | 'admin' | 'user';
  createdAt: Timestamp;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  address: string;
  createdAt: Timestamp;
}

export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  location: string;
  createdAt: Timestamp;
}

export interface Location {
  id: string;
  warehouseId: string;
  name: string; // e.g., Aisle 1, Shelf B, Bin 3
  barcode: string;
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  createdAt: Timestamp;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  companyId: string;
  customerId: string;
  orderDate: Timestamp;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface InventoryBalance {
  id: string; // Combination of productId and locationId
  productId: string;
  locationId: string;
  quantity: number;
  lastUpdated: Timestamp;
}

export type InventoryLedgerType = 'inbound' | 'outbound' | 'adjustment';

export interface InventoryLedger {
  id: string;
  productId: string;
  locationId: string;
  type: InventoryLedgerType;
  quantityChange: number;
  relatedOrderId?: string;
  timestamp: Timestamp;
  userId: string;
}

export interface Evidence {
  id: string;
  relatedId: string; // e.g., orderId, inventoryLedgerId
  type: 'photo' | 'document';
  storagePath: string;
  url: string;
  createdAt: Timestamp;
  userId: string;
}
