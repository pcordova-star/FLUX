'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFirebase } from '@/context/firebase-provider';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ReceiveStockDialog } from '@/components/inventory/receive-stock-dialog';
import type { InventoryBalance } from '@/lib/types';
import PageSpinner from '@/components/page-spinner';

const StockStatusBadge = ({ qty }: { qty: number }) => {
  const status = qty === 0 
    ? 'critical' 
    : qty <= 10 
    ? 'low' 
    : 'ok';

  const variant: "destructive" | "secondary" | "default" = {
    critical: 'destructive',
    low: 'secondary',
    ok: 'default',
  }[status] as "destructive" | "secondary" | "default";
  
  const text = {
    critical: 'Crítico',
    low: 'Bajo',
    ok: 'OK',
  }[status];

  return <Badge variant={variant}>{text}</Badge>;
};

export default function InventoryPage() {
  const { companyId, loading: authLoading } = useAuth();
  const { firestore } = useFirebase();
  const [isReceiveStockOpen, setReceiveStockOpen] = useState(false);

  const balancesQuery = useMemo(() => {
    if (!companyId || !firestore) return null;
    return query(
      collection(firestore, 'inventory_balances'),
      where('companyId', '==', companyId),
      orderBy('updatedAt', 'desc')
    );
  }, [companyId, firestore]);

  const [balancesSnapshot, loading, error] = useCollection(balancesQuery);

  if (authLoading) {
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
            {error && (
              <div className="text-center py-10 text-destructive">
                <p>Error al cargar el inventario: {error.message}</p>
                <p className="text-sm">Por favor, intenta refrescar la página.</p>
              </div>
            )}
            {loading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {!loading && !error && balances.length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-semibold">No hay saldos de inventario</h3>
                <p className="text-muted-foreground mt-2">
                  No se encontraron productos en ningún almacén.
                </p>
                <p className="text-sm text-muted-foreground">
                  Intenta recibir stock para empezar a gestionar tu inventario.
                </p>
              </div>
            ) : null}
            {!loading && !error && balances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead className="text-right">Reservado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">{balance.sku}</TableCell>
                      <TableCell>{balance.warehouseId}</TableCell>
                      <TableCell>{balance.clientId}</TableCell>
                      <TableCell>
                        <StockStatusBadge qty={balance.qty} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">{balance.qty}</TableCell>
                      <TableCell className="text-right">{balance.reservedQty || 0}</TableCell>
                      <TableCell>
                        {balance.updatedAt ? format(balance.updatedAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
