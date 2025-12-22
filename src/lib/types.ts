
import type { FieldValue, Timestamp } from 'firebase/firestore';

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'supervisor'
  | 'warehouse_operator'
  | 'driver'
  | 'client_viewer';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  companyId: string;
  clientId?: string;
  warehouseIds?: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Company {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface Client {
  id: string;
  name: string;
  companyId: string;
  createdAt: Timestamp;
}

export interface Warehouse {
  id: string;
  name: string;
  companyId: string;
  createdAt: Timestamp;
}

export interface Location {
  id: string;
  name: string;
  warehouseId: string;
  companyId: string;
  createdAt: Timestamp;
}

export type OrderStatus = 'created' | 'received' | 'picking' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['created', 'received', 'picking', 'packed', 'shipped', 'delivered', 'cancelled'];
export type OrderPriority = 'express' | 'same_day' | 'next_day' | 'scheduled';
export const ORDER_PRIORITIES: OrderPriority[] = ['express', 'same_day', 'next_day', 'scheduled'];


export interface Order {
  id: string;
  companyId: string;
  clientId: string;
  warehouseId: string;
  orderNumber: string;
  promiseAt: Timestamp;
  status: OrderStatus;
  priority: OrderPriority;
  createdAt: Timestamp | FieldValue;
  createdBy: string; // user uid
}

export type OrderEvent = {
  id?: string;
  companyId: string;
  type: OrderStatus | 'info' | 'error';
  message: string;
  createdAt: Timestamp | FieldValue;
  createdBy: string; // user uid
}


// Below are other types from the original app, kept for reference
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

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
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
