'use client';

import {
  doc,
  collection,
  serverTimestamp,
  runTransaction,
  increment,
  type Firestore,
} from 'firebase/firestore';
import { sanitizeDocId } from '@/lib/utils';


interface TransferStockInput {
  companyId: string;
  sku: string;
  qty: number;
  fromWarehouseId: string;
  toWarehouseId: string;
  clientId: string; // Assuming transfers happen for a single client owner of the stock
  note?: string;
}

/**
 * Transfers stock between two warehouses atomically. This transaction will:
 * 1. Validate that there is enough stock in the source warehouse.
 * 2. Decrement the quantity in the source inventory balance.
 * 3. Increment the quantity in the destination inventory balance (creating it if necessary).
 * 4. Create two ledger entries (outbound and inbound) linked by a common `transferId`.
 */
export async function transferStock(db: Firestore, input: TransferStockInput, userId: string): Promise<void> {
  const { companyId, sku, qty, fromWarehouseId, toWarehouseId, clientId, note } = input;

  if (fromWarehouseId === toWarehouseId) {
    throw new Error('El almacén de origen y destino no pueden ser el mismo.');
  }
  if (qty <= 0) {
    throw new Error('La cantidad a transferir debe ser un número positivo.');
  }

  const sanitizedSku = sku.trim().toLowerCase();
  const fromBalanceId = sanitizeDocId(`${companyId}_${fromWarehouseId}_${clientId}_${sanitizedSku}`);
  const toBalanceId = sanitizeDocId(`${companyId}_${toWarehouseId}_${clientId}_${sanitizedSku}`);

  const fromBalanceRef = doc(db, 'inventory_balances', fromBalanceId);
  const toBalanceRef = doc(db, 'inventory_balances', toBalanceId);
  
  const transferId = doc(collection(db, 'dummy')).id; // Generate a unique ID for the transfer

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get and validate source balance
      const fromBalanceDoc = await transaction.get(fromBalanceRef);
      if (!fromBalanceDoc.exists()) {
        throw new Error(`No hay stock para el SKU ${sku} en el almacén de origen ${fromWarehouseId}.`);
      }
      
      const availableQty = fromBalanceDoc.data().qty - (fromBalanceDoc.data().reservedQty || 0);
      if (availableQty < qty) {
        throw new Error(`Stock insuficiente en origen. Disponible: ${availableQty}, Requerido: ${qty}.`);
      }

      // 2. Get destination balance (it might not exist)
      const toBalanceDoc = await transaction.get(toBalanceRef);

      // 3. Update source balance (decrement)
      transaction.update(fromBalanceRef, {
        qty: increment(-qty),
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });

      // 4. Update or create destination balance (increment)
      if (toBalanceDoc.exists()) {
        transaction.update(toBalanceRef, {
          qty: increment(qty),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      } else {
        // Create a new balance for the destination warehouse
        transaction.set(toBalanceRef, {
          companyId,
          warehouseId: toWarehouseId,
          clientId,
          sku: sanitizedSku,
          qty,
          reservedQty: 0,
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });
      }

      // 5. Create outbound ledger entry for the source warehouse
      const fromLedgerRef = doc(collection(db, 'inventory_ledger'));
      transaction.set(fromLedgerRef, {
        companyId,
        warehouseId: fromWarehouseId,
        clientId,
        sku: sanitizedSku,
        deltaQty: -qty,
        type: 'outbound',
        refType: 'transfer',
        transferId,
        note: note || `Transferencia a ${toWarehouseId}`,
        createdAt: serverTimestamp(),
        createdBy: userId,
      });

      // 6. Create inbound ledger entry for the destination warehouse
      const toLedgerRef = doc(collection(db, 'inventory_ledger'));
      transaction.set(toLedgerRef, {
        companyId,
        warehouseId: toWarehouseId,
        clientId,
        sku: sanitizedSku,
        deltaQty: qty,
        type: 'inbound',
        refType: 'transfer',
        transferId,
        note: note || `Transferencia desde ${fromWarehouseId}`,
        createdAt: serverTimestamp(),
        createdBy: userId,
      });
    });

    console.log(`[Inventory] Stock transfer ${transferId} completed successfully.`);
  } catch (error) {
    console.error("Error en la transacción de transferencia de stock:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("La operación de transferencia de stock falló. Por favor, inténtalo de nuevo.");
  }
}
