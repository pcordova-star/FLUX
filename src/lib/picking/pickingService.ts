'use client';

import {
  doc,
  collection,
  serverTimestamp,
  runTransaction,
  increment,
  type Firestore,
} from 'firebase/firestore';
import type { Order, OrderEvent } from '@/lib/types';

interface PickingOperationInput {
  companyId: string;
  warehouseId: string;
  clientId: string;
  orderId: string;
}

/**
 * Sanitizes a string to be used as a Firestore document ID.
 * Trims, lowercases, and replaces spaces and common URL/path characters with underscores.
 */
function sanitizeDocId(id: string): string {
    return id
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_') // Replace one or more spaces with a single underscore
        .replace(/[\/?#%\[\]&=+:@!$'()*;,.~]/g, '_'); // Replace common special characters with an underscore
}


/**
 * Reserves stock for a given order. This transaction will:
 * 1. Read the order to get the items.
 * 2. For each item, check if there is enough available stock (qty - reservedQty).
 * 3. If so, update the inventory balance to increment `reservedQty`.
 * 4. Create an 'reserve' ledger entry for each item.
 * 5. Create an order event to log the reservation.
 */
export async function reserveForOrder(db: Firestore, input: PickingOperationInput, userId: string): Promise<void> {
  const { companyId, warehouseId, clientId, orderId } = input;
  const orderRef = doc(db, 'orders', orderId);

  try {
    await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists() || orderDoc.data().companyId !== companyId) {
        throw new Error('La orden no existe o no tienes permiso para acceder a ella.');
      }

      const order = orderDoc.data() as Order;
      if (order.status !== 'created' && order.status !== 'received') {
        throw new Error(`No se puede reservar stock para una orden en estado "${order.status}".`);
      }

      if (!order.items || order.items.length === 0) {
        throw new Error('La orden no tiene ítems para reservar.');
      }

      // Check availability and prepare updates
      for (const item of order.items) {
        const balanceId = sanitizeDocId(`${companyId}_${warehouseId}_${clientId}_${item.sku.trim().toLowerCase()}`);
        const balanceRef = doc(db, 'inventory_balances', balanceId);
        const balanceDoc = await transaction.get(balanceRef);

        if (!balanceDoc.exists()) {
          throw new Error(`No existe balance de inventario para el SKU ${item.sku}. Imposible reservar.`);
        }

        const currentQty = balanceDoc.data().qty || 0;
        const currentReservedQty = balanceDoc.data().reservedQty || 0;
        const availableQty = currentQty - currentReservedQty;
        
        if (availableQty < item.qty) {
          throw new Error(`Stock insuficiente para ${item.sku}. Necesario: ${item.qty}, Disponible: ${availableQty}`);
        }
      }

      // If all checks pass, perform the updates
      for (const item of order.items) {
        const balanceId = sanitizeDocId(`${companyId}_${warehouseId}_${clientId}_${item.sku.trim().toLowerCase()}`);
        const balanceRef = doc(db, 'inventory_balances', balanceId);
        const ledgerRef = doc(collection(db, 'inventory_ledger'));

        // Update balance
        transaction.update(balanceRef, {
          reservedQty: increment(item.qty),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });

        // Create ledger entry
        transaction.set(ledgerRef, {
          companyId,
          warehouseId,
          clientId,
          sku: item.sku,
          reservedDeltaQty: item.qty,
          type: 'reserve',
          relatedOrderId: orderId,
          createdAt: serverTimestamp(),
          createdBy: userId,
        });
      }

      // Add order event
      const eventRef = doc(collection(db, 'orders', orderId, 'events'));
      const newEvent: Omit<OrderEvent, 'id'> = {
        companyId: order.companyId,
        type: 'info',
        message: 'Stock reservado para la orden.',
        createdAt: serverTimestamp(),
        createdBy: userId,
      };
      transaction.set(eventRef, newEvent);
    });
    console.log('[Inventory] Stock reservation registered successfully.');
  } catch (error: any) {
    console.error("Error en la transacción de reserva de stock:", error);
    throw new Error(error.message || "La operación de reserva falló.");
  }
}

/**
 * Confirms the picking of a previously reserved order. This transaction will:
 * 1. Read the order and its items.
 * 2. For each item, update the inventory balance: decrement `qty` and `reservedQty`.
 * 3. Create a 'pick' ledger entry for each item.
 * 4. Update the order status to 'picking'.
 * 5. Create an order event to log the pick confirmation.
 * 6. Update KPI snapshot if an item becomes out of stock.
 */
export async function confirmPick(db: Firestore, input: PickingOperationInput, userId: string): Promise<void> {
  const { companyId, warehouseId, clientId, orderId } = input;
  const orderRef = doc(db, 'orders', orderId);
  const kpiRef = doc(db, 'kpi_snapshots', companyId);

  try {
    await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists() || orderDoc.data().companyId !== companyId) {
        throw new Error('La orden no existe o no tienes permiso para acceder a ella.');
      }

      const order = orderDoc.data() as Order;
      // Allow picking if it's created, received, or already being picked (idempotency)
      if (!['created', 'received', 'picking'].includes(order.status)) {
         throw new Error(`No se puede confirmar el picking para una orden en estado "${order.status}".`);
      }

      if (!order.items || order.items.length === 0) {
        throw new Error('La orden no tiene ítems para confirmar el picking.');
      }

      let criticalStockChange = 0;

      // Check if there is enough reservation and stock
      for (const item of order.items) {
        const balanceId = sanitizeDocId(`${companyId}_${warehouseId}_${clientId}_${item.sku.trim().toLowerCase()}`);
        const balanceRef = doc(db, 'inventory_balances', balanceId);
        const balanceDoc = await transaction.get(balanceRef);
        
        if (!balanceDoc.exists()) {
            throw new Error(`No existe balance de inventario para el SKU ${item.sku}. Imposible confirmar pick.`);
        }
        
        const data = balanceDoc.data();
        const currentQty = data.qty || 0;
        const currentReservedQty = data.reservedQty || 0;

        if (currentReservedQty < item.qty) {
          throw new Error(`Reserva insuficiente para ${item.sku}. Necesario: ${item.qty}, Reservado: ${currentReservedQty}`);
        }
        if (currentQty < item.qty) {
          throw new Error(`Stock físico insuficiente para ${item.sku}. Necesario: ${item.qty}, Físico: ${currentQty}`);
        }

        // Check if this movement will make the stock critical
        if (currentQty - item.qty === 0) {
            criticalStockChange++;
        }
      }

      // If all checks pass, perform updates
      for (const item of order.items) {
        const balanceId = sanitizeDocId(`${companyId}_${warehouseId}_${clientId}_${item.sku.trim().toLowerCase()}`);
        const balanceRef = doc(db, 'inventory_balances', balanceId);
        const ledgerRef = doc(collection(db, 'inventory_ledger'));

        // Update balance
        transaction.update(balanceRef, {
          qty: increment(-item.qty),
          reservedQty: increment(-item.qty),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });

        // Create ledger entry
        transaction.set(ledgerRef, {
          companyId,
          warehouseId,
          clientId,
          sku: item.sku.trim().toLowerCase(),
          deltaQty: -item.qty,
          reservedDeltaQty: -item.qty,
          type: 'pick',
          relatedOrderId: orderId,
          createdAt: serverTimestamp(),
          createdBy: userId,
        });
      }

      // Update order status, only if it's not already 'picking'
      if (order.status !== 'picking') {
        transaction.update(orderRef, { status: 'picking' });
      }

      // Add order event
      const eventRef = doc(collection(db, 'orders', orderId, 'events'));
      const newEvent: Omit<OrderEvent, 'id'> = {
        companyId: order.companyId,
        type: 'picking',
        message: 'Picking confirmado y completado.',
        createdAt: serverTimestamp(),
        createdBy: userId,
      };
      transaction.set(eventRef, newEvent);

      // Update KPI snapshot if needed
      if (criticalStockChange > 0) {
        transaction.set(kpiRef, { criticalStockItems: increment(criticalStockChange), updatedAt: serverTimestamp() }, { merge: true });
      }
    });
     console.log('[Inventory] Pick confirmation registered successfully.');
  } catch (error: any) {
    console.error("Error en la transacción de confirmación de picking:", error);
    throw new Error(error.message || "La operación de confirmación de picking falló.");
  }
}
