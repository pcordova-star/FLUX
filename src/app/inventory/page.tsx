'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase-client';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ReceiveStockDialog } from '@/components/inventory/receive-stock-dialog';
import type { InventoryBalance } from '@/lib/types';
import PageSpinner from '@/components/page-spinner';

export default function InventoryPage() {
  const { companyId, loading: authLoading } = useAuth();
  const [isReceiveStockOpen, setReceiveStockOpen] = useState(false);

  const [balancesSnapshot, loading, error] = useCollection(
    companyId ? query(
      collection(db, 'inventory_balances'),
      where('companyId', '==', companyId),
      orderBy('updatedAt', 'desc')
    ) : null
  );

  if (authLoading || loading) {
    return <PageSpinner />;
  }

  const balances = balancesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryBalance)) || [];

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <Button onClick={() => setReceiveStockOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Recibir Stock
          </Button>
        </div>

        <ReceiveStockDialog
          isOpen={isReceiveStockOpen}
          onOpenChange={setReceiveStockOpen}
        />

        <Card>
          <CardHeader>
            <CardTitle>Saldos de Inventario</CardTitle>
            <CardDescription>Stock actual por producto y almacén.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive">Error: {error.message}</p>}
            {loading && <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}
            {!loading && balances.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No hay saldos de inventario para mostrar.</p>
                <p className="text-sm text-muted-foreground">Intenta recibir stock para empezar.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Última Actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">{balance.sku}</TableCell>
                      <TableCell>{balance.warehouseId}</TableCell>
                      <TableCell>{balance.clientId}</TableCell>
                      <TableCell className="text-right">{balance.qty}</TableCell>
                      <TableCell>
                        {balance.updatedAt ? format(balance.updatedAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
