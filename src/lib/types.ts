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

export const ORDER_STATUSES = ['created', 'received', 'picking', 'packed', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];


export const ORDER_PRIORITIES = ['express', 'same_day', 'next_day', 'scheduled'] as const;
export type OrderPriority = typeof ORDER_PRIORITIES[number];


export interface Order {
  id: string;
  companyId: string;
  clientId: string;
  warehouseId: string;
  orderNumber: string;
  promiseAt: Timestamp;
  status: OrderStatus;
  priority: OrderPriority;
  items: { sku: string; qty: number }[];
  totalItems: number;
  totalUnits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // user uid
}

export type OrderEvent = {
  id: string;
  companyId: string;
  type: OrderStatus | 'info' | 'error';
  message: string;
  createdAt: Timestamp | null;
  createdBy: string; // user uid
}


export interface InventoryBalance {
  id: string;
  companyId: string;
  warehouseId: string;
  clientId: string;
  sku: string;
  qty: number;
  reservedQty: number;
  updatedAt: Timestamp | null;
  updatedBy: string;
}

export const INVENTORY_LEDGER_TYPES = ['inbound', 'reserve', 'pick'] as const;
export type InventoryLedgerType = typeof INVENTORY_LEDGER_TYPES[number];

export interface InventoryLedger {
  id: string;
  companyId: string;
  warehouseId:string;
  clientId: string;
  sku: string;
  deltaQty: number;
  reservedDeltaQty?: number;
  type: InventoryLedgerType;
  refType?: 'manual' | 'po';
  relatedOrderId?: string;
  note?: string;
  createdAt: Timestamp | null;
  createdBy: string;
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

export interface Evidence {
  id: string;
  relatedId: string; // e.g., orderId, inventoryLedgerId
  type: 'photo' | 'document';
  storagePath: string;
  url: string;
  createdAt: Timestamp;
  userId: string;
}
