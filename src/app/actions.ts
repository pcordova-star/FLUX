'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import type { Order, OrderEvent, OrderStatus, UserRole } from '@/lib/types';


// Set credentials directly for the server-side admin SDK
// In a production environment, these should be loaded securely from environment variables
// and not hardcoded.
process.env.FIREBASE_PROJECT_ID = "studio-7575474202-582d8";
process.env.FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-g1q4r@studio-7575474202-582d8.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCp4F9XyJ9Zt8i8\\nB2f0vC3P2eY5Z8i/e2b6Z3b3Y5j8Z9i6f8V7e3f8b3c6X5g6g7h8k9l5a4c3e2f1\\nb3d8e9f8a7c6d5e4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8\\nf7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6\\ns5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4\\nf3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2\\nb1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0d9e8f7a6s5d4f3a2b1c0\\nd9e8f7a6s5d4f3a2b1c_PRIVATE_KEY-----".replace(/\\n/g, '\n');

interface UserSeedData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive?: boolean;
}

const addOrderWithEvents = (
  batch: FirebaseFirestore.WriteBatch,
  companyId: string,
  warehouseId: string,
  userId: string,
  orderData: Omit<Order, 'id' | 'companyId' | 'warehouseId' | 'items' | 'createdAt' | 'updatedAt' | 'createdBy' | 'totalItems' | 'totalUnits'> & { items: { sku: string, qty: number }[] },
  events: Omit<OrderEvent, 'id' | 'companyId' | 'createdAt' | 'createdBy'>[]
) => {
  const orderRef = adminDb.collection('orders').doc();
  const totalItems = orderData.items.length;
  const totalUnits = orderData.items.reduce((sum, item) => sum + item.qty, 0);

  const finalOrderData: Omit<Order, 'id'> = {
    ...orderData,
    companyId,
    warehouseId,
    totalItems,
    totalUnits,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: userId,
  };
  batch.set(orderRef, finalOrderData);

  for (const event of events) {
    const eventRef = orderRef.collection('events').doc();
    batch.set(eventRef, { ...event, companyId, createdBy: userId, createdAt: Timestamp.now() });
  }
};


export async function seedDatabase() {
  try {
    const now = Timestamp.now();
    const SEED_ID = `seed_${now.toMillis()}`;
    const seedLogRef = adminDb.collection('seed_log').doc(SEED_ID);
    
    const existingSeedLog = await seedLogRef.get();
    if (existingSeedLog.exists) {
        const message = 'La base de datos ya ha sido inicializada previamente. No se realizarán cambios.';
        console.warn(`[Seed Action] ${message}`);
        return { success: false, message };
    }

    const batch = adminDb.batch();

    // 1. Company
    const companyId = 'flux_demo_company';
    const companyRef = adminDb.collection('companies').doc(companyId);
    batch.set(companyRef, { name: 'FLUX Demo Company', createdAt: now, demoDataLoaded: true });

    // 2. Users and Auth
    const usersToSeed: UserSeedData[] = [
      { uid: 'admin_user_id', email: 'admin@demo.com', displayName: 'Admin Demo', role: 'admin' },
      { uid: 'operator_user_id', email: 'operator@demo.com', displayName: 'Operator Demo', role: 'operator' },
      { uid: 'viewer_user_id', email: 'viewer@demo.com', displayName: 'Viewer Demo', role: 'viewer' },
    ];
    for (const user of usersToSeed) {
        // Create user doc in Firestore
        const userRef = adminDb.collection('users').doc(user.uid);
        batch.set(userRef, { ...user, companyId: companyId, isActive: true, createdAt: now });
        
        // You would typically create the auth user here as well.
        // For this environment, we assume they can be created manually or exist.
        // await adminAuth.createUser({ uid: user.uid, email: user.email, password: 'password' });
    }

    // 3. Warehouse
    const warehouseId = 'wh_demo_scl';
    const warehouseRef = adminDb.collection('warehouses').doc(warehouseId);
    batch.set(warehouseRef, { name: 'Almacén Principal (Demo)', companyId, createdAt: now });

    // 4. Products and Inventory
    const products = [
      { name: 'Laptop Pro X1', sku: 'LAP-PRO-X1', stock: 50 }, // OK
      { name: 'Monitor Curvo 27"', sku: 'MON-CUR-27', stock: 8 },  // Low
      { name: 'Teclado Mecánico RGB', sku: 'KEY-MEC-RGB', stock: 0 },// Critical
    ];
    
    let criticalStockCount = 0;
    for (const product of products) {
        // Product
        const productRef = adminDb.collection('products').doc(product.sku);
        batch.set(productRef, { name: product.name, sku: product.sku, companyId, createdAt: now });

        if (product.stock > 0) {
            // Inventory Balance
            const balanceId = `${companyId}_${warehouseId}_default_${product.sku.toLowerCase()}`;
            const balanceRef = adminDb.collection('inventory_balances').doc(balanceId);
            batch.set(balanceRef, {
                companyId, warehouseId, clientId: 'default', sku: product.sku,
                qty: product.stock, reservedQty: 0, updatedAt: now
            });
            // Ledger Entry
            const ledgerRef = adminDb.collection('inventory_ledger').doc();
            batch.set(ledgerRef, {
                companyId, warehouseId, clientId: 'default', sku: product.sku,
                deltaQty: product.stock, type: 'inbound', refType: 'manual', 
                note: 'Stock inicial demo', createdAt: now
            });
        }
        if (product.stock === 0) {
            criticalStockCount++;
        }
    }

    // 5. Orders
    const adminUserId = usersToSeed[0].uid;
    // Order 1: Completed
    addOrderWithEvents(batch, companyId, warehouseId, adminUserId,
      { orderNumber: 'DEMO-1001', clientId: 'default', priority: 'scheduled', status: 'delivered', promiseAt: Timestamp.fromMillis(now.toMillis() - 86400000 * 2) /* 2 days ago */, items: [{ sku: 'LAP-PRO-X1', qty: 1 }] },
      [
        { type: 'created', message: 'Orden creada.' },
        { type: 'picking', message: 'Picking confirmado.' },
        { type: 'packed', message: 'Orden empacada.' },
        { type: 'shipped', message: 'Orden enviada.' },
        { type: 'delivered', message: 'Orden entregada.' },
      ]
    );

    // Order 2: Open
    addOrderWithEvents(batch, companyId, warehouseId, adminUserId,
      { orderNumber: 'DEMO-1002', clientId: 'default', priority: 'next_day', status: 'picking', promiseAt: Timestamp.fromMillis(now.toMillis() + 86400000) /* tomorrow */, items: [{ sku: 'MON-CUR-27', qty: 2 }] },
      [
        { type: 'created', message: 'Orden creada.' },
        { type: 'picking', message: 'Picking confirmado.' },
      ]
    );

    // 6. KPI Snapshot
    const kpiRef = adminDb.collection('kpi_snapshots').doc(companyId);
    batch.set(kpiRef, {
        companyId,
        ordersToday: 2,
        ordersInProgress: 1, // Only DEMO-1002 is open
        ordersDelayed: 0,
        criticalStockItems: criticalStockCount,
        updatedAt: now,
    });

    // 7. Log Seed Operation
    batch.set(seedLogRef, {
      seededAt: now,
      status: 'success',
      description: 'Acción de inicialización con datos de demostración.',
      details: `Created company '${companyId}', 3 users, 1 warehouse, 3 products, 2 orders.`,
    });

    await batch.commit();
    
    console.log('[Seed Action] Database seeded successfully with demo data at', new Date());

    revalidatePath('/admin/seed');
    
    return { success: true, message: 'Base de datos inicializada correctamente con datos de demostración.' };

  } catch (error) {
    console.error('[Seed Action] Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, message: `Fallo al inicializar la base de datos: ${errorMessage}` };
  }
}
