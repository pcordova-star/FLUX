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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { CreateOrderDialog } from '@/components/orders/create-order-dialog';
import type { Order } from '@/lib/types';
import PageSpinner from '@/components/page-spinner';

export default function OrdersPage() {
  const { companyId, loading: authLoading } = useAuth();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const [ordersSnapshot, loading, error] = useCollection(
    companyId ? query(
      collection(db, 'orders'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    ) : null
  );

  if (authLoading || loading) {
    return <PageSpinner />;
  }

  const orders = ordersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)) || [];

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </div>
        
        <CreateOrderDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        <Card>
          <CardHeader>
            <CardTitle>Gestionar Pedidos</CardTitle>
            <CardDescription>Visualiza y gestiona los pedidos de los clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive">Error: {error.message}</p>}
            {orders.length === 0 && !loading ? (
              <p>No se encontraron pedidos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Fecha Promesa</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.priority}</TableCell>
                      <TableCell>
                        {order.promiseAt ? format(order.promiseAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/orders/${order.id}`}>Ver</Link>
                        </Button>
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
