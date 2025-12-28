
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Order, OrderEvent, OrderStatus, UserRole } from '@/lib/types';
import { getUserServerContext, type UserServerContext } from '@/lib/exports/authz';

// This is a simplified version of the seed data structure from actions.ts
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
  const adminDb = getAdminDb();
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

export async function POST(req: NextRequest) {
  let userContext: UserServerContext | null = null;
  
  try {
    console.log("[Seed][AdminInit] Using explicit service account auth");
    const adminDb = getAdminDb();

    // 1. Get user context
    userContext = await getUserServerContext(req);

    // 2. Check if seeding has been performed before.
    const seedLogCollection = await adminDb.collection('seed_log').limit(1).get();
    if (!seedLogCollection.empty) {
      const message = 'La base de datos ya ha sido inicializada previamente. No se realizarán cambios.';
      console.warn(`[SEED][DENY] ${message}`);
      return new NextResponse(JSON.stringify({ ok: false, message: message }), { status: 409 });
    }

    // 3. Authorization Logic
    const companiesSnap = await adminDb.collection('companies').limit(1).get();
    const noCompaniesExist = companiesSnap.empty;

    const role = userContext?.role ?? null;
    const isBootstrapAllowed = noCompaniesExist;
    const isAdmin = role === 'admin' || role === 'super_admin';

    // Log auth context for debugging
    console.log('[SEED][AUTH] Context:', {
      uid: userContext?.uid,
      role: userContext?.role,
      companyId: userContext?.companyId,
      isBootstrapAllowed,
      isAdmin,
    });

    if (!isBootstrapAllowed && !isAdmin) {
      const details = {
        denyReason: 'companies_exist_requires_admin',
        uid: userContext?.uid,
        role: userContext?.role,
        companyId: userContext?.companyId,
        isActive: userContext?.appUser?.isActive,
        noCompaniesExist,
      };
      console.log('[SEED][DENY]', details);
      return new NextResponse(
        JSON.stringify({ ok: false, message: 'No tienes permiso para realizar esta acción.', details }),
        { status: 403 }
      );
    }
    
    // --- If authorization passes, proceed with seeding ---
    console.log('[SEED] Authorization passed. Proceeding.');
    
    const now = Timestamp.now();
    const SEED_ID = `seed_${now.toMillis()}`;
    const seedLogRef = adminDb.collection('seed_log').doc(SEED_ID);
    
    const batch = adminDb.batch();

    // 1. Company
    const companyId = 'flux_demo_company';
    const companyRef = adminDb.collection('companies').doc(companyId);
    batch.set(companyRef, { name: 'FLUX Demo Company', createdAt: now, demoDataLoaded: true });
    console.log(`[SEED] Prepared: Company '${companyId}'`);

    // 2. Users and Auth
    const usersToSeed: UserSeedData[] = [
      { uid: 'admin_user_id', email: 'admin@demo.com', displayName: 'Admin Demo', role: 'admin' },
      { uid: 'operator_user_id', email: 'operator@demo.com', displayName: 'Operator Demo', role: 'operator' },
      { uid: 'viewer_user_id', email: 'viewer@demo.com', displayName: 'Viewer Demo', role: 'viewer' },
    ];
    for (const user of usersToSeed) {
      const userRef = adminDb.collection('users').doc(user.uid);
      batch.set(userRef, { ...user, companyId: companyId, isActive: true, createdAt: now });
    }
    console.log(`[SEED] Prepared: ${usersToSeed.length} users`);

    // 3. Warehouse
    const warehouseId = 'wh_demo_scl';
    const warehouseRef = adminDb.collection('warehouses').doc(warehouseId);
    batch.set(warehouseRef, { name: 'Almacén Principal (Demo)', companyId, createdAt: now });
    console.log(`[SEED] Prepared: Warehouse '${warehouseId}'`);

    // 4. Products and Inventory
    const products = [
      { name: 'Laptop Pro X1', sku: 'LAP-PRO-X1', stock: 50 },
      { name: 'Monitor Curvo 27"', sku: 'MON-CUR-27', stock: 8 },
      { name: 'Teclado Mecánico RGB', sku: 'KEY-MEC-RGB', stock: 0 },
    ];
    let criticalStockCount = 0;
    for (const product of products) {
      const productRef = adminDb.collection('products').doc(product.sku);
      batch.set(productRef, { name: product.name, sku: product.sku, companyId, createdAt: now });
      if (product.stock > 0) {
        const balanceId = `${companyId}_${warehouseId}_default_${product.sku.toLowerCase()}`;
        const balanceRef = adminDb.collection('inventory_balances').doc(balanceId);
        batch.set(balanceRef, { companyId, warehouseId, clientId: 'default', sku: product.sku, qty: product.stock, reservedQty: 0, updatedAt: now });
        const ledgerRef = adminDb.collection('inventory_ledger').doc();
        batch.set(ledgerRef, { companyId, warehouseId, clientId: 'default', sku: product.sku, deltaQty: product.stock, type: 'inbound', refType: 'manual', note: 'Stock inicial demo', createdAt: now });
      }
      if (product.stock === 0) criticalStockCount++;
    }
    console.log(`[SEED] Prepared: ${products.length} products and inventory balances.`);

    // 5. Orders
    const adminUserId = usersToSeed[0].uid;
    addOrderWithEvents(batch, companyId, warehouseId, adminUserId,
      { orderNumber: 'DEMO-1001', clientId: 'default', priority: 'scheduled', status: 'delivered', promiseAt: Timestamp.fromMillis(now.toMillis() - 86400000 * 2), items: [{ sku: 'LAP-PRO-X1', qty: 1 }] },
      [{ type: 'created', message: 'Orden creada.' }, { type: 'picking', message: 'Picking confirmado.' }, { type: 'packed', message: 'Orden empacada.' }, { type: 'shipped', message: 'Orden enviada.' }, { type: 'delivered', message: 'Orden entregada.' }]
    );
    addOrderWithEvents(batch, companyId, warehouseId, adminUserId,
      { orderNumber: 'DEMO-1002', clientId: 'default', priority: 'next_day', status: 'picking', promiseAt: Timestamp.fromMillis(now.toMillis() + 86400000), items: [{ sku: 'MON-CUR-27', qty: 2 }] },
      [{ type: 'created', message: 'Orden creada.' }, { type: 'picking', message: 'Picking confirmado.' }]
    );
    console.log('[SEED] Prepared: 2 orders with events.');

    // 6. KPI Snapshot
    const kpiRef = adminDb.collection('kpi_snapshots').doc(companyId);
    batch.set(kpiRef, {
      companyId, ordersToday: 2, ordersInProgress: 1, ordersDelayed: 0,
      criticalStockItems: criticalStockCount, updatedAt: now,
    });
    console.log('[SEED] Prepared: KPI Snapshot.');

    // 7. Log Seed Operation
    batch.set(seedLogRef, {
      seededAt: now,
      status: 'success',
      description: 'Acción de inicialización con datos de demostración.',
      details: `Created company '${companyId}', 3 users, 1 warehouse, 3 products, 2 orders.`,
    });

    await batch.commit();
    
    console.log('[SEED] Batch commit successful.');

    return new NextResponse(JSON.stringify({ ok: true, message: 'Base de datos inicializada correctamente con datos de demostración.' }), { status: 200 });

  } catch (error: any) {
    console.error('[SEED][ERROR]', error);
    
    // For auth/permission errors that we throw deliberately
    if (error.message.includes('No autorizado')) {
        const details = { denyReason: "invalid_session", uid: userContext?.uid, role: userContext?.role };
        console.log('[SEED][DENY]', details);
        return new NextResponse(
            JSON.stringify({ ok: false, message: 'No tienes permiso para realizar esta acción.', details }),
            { status: 403 }
        );
    }
    
    // For all other errors, including admin init failures
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return new NextResponse(JSON.stringify({ 
        ok: false, 
        message: `Admin credentials failure: ${errorMessage}`, 
        details: String(error) 
    }), { status: 500 });
  }
}
