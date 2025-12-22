import type { Timestamp } from 'firebase/firestore';

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
