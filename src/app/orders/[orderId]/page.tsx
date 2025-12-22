'use client';

import React, { useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { updateOrderStatus } from '@/lib/orders/ordersService';
import { reserveForOrder, confirmPick } from '@/lib/picking/pickingService';
import type { Order, OrderEvent, OrderStatus } from '@/lib/types';
import PageSpinner from '@/components/page-spinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ORDER_STATUSES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageCheck, Package, ShoppingCart, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusIcons = {
  created: ShoppingCart,
  received: Package,
  picking: Package,
  packed: PackageCheck,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  info: Package,
  error: XCircle
};

function OrderTimeline({ order }: { order: Order }) {
  const [eventsSnapshot, loading, error] = useCollection(
    query(collection(db, 'orders', order.id, 'events'), orderBy('createdAt', 'desc'))
  );

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  if (error) return <p className="text-destructive">Error al cargar eventos: {error.message}</p>;

  const events = eventsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderEvent)) || [];

  return (
    <div className="space-y-6">
      {events.map((event, idx) => {
        const Icon = statusIcons[event.type] || Package;
        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </span>
              { idx < events.length - 1 && <div className="h-full w-px bg-border my-1"></div> }
            </div>
            <div>
              <p className="font-medium">{event.message}</p>
              <p className="text-sm text-muted-foreground">
                {event.createdAt ? format(event.createdAt.toDate(), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es }) : '...'}
              </p>
            </div>
          </div>
        );
      })}
       {events.length === 0 && <p>No hay eventos para esta orden.</p>}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { user, companyId, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isPickingActionPending, startPickingActionTransition] = useTransition();
  
  const [orderSnapshot, loading, error] = useDocument(
    orderId ? doc(db, 'orders', orderId) : null
  );

  const order = orderSnapshot?.exists() ? { id: orderSnapshot.id, ...orderSnapshot.data() } as Order : null;

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || !user) return;
    setIsUpdatingStatus(true);
    try {
      await updateOrderStatus(order.id, newStatus, user.uid);
      toast({
        title: 'Éxito',
        description: `El estado de la orden ha sido actualizado a "${newStatus}".`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'No se pudo actualizar el estado de la orden.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePickingAction = (action: 'reserve' | 'confirm') => {
    if (!order || !user || !companyId) return;

    startPickingActionTransition(async () => {
      const actionFunc = action === 'reserve' ? reserveForOrder : confirmPick;
      const successMessage = action === 'reserve' ? 'Stock reservado correctamente.' : 'Picking confirmado correctamente.';
      const actionName = action === 'reserve' ? 'reservar' : 'confirmar pick';
      
      try {
        await actionFunc({
          orderId,
          companyId,
          warehouseId: order.warehouseId,
          clientId: order.clientId,
        }, user.uid);
        toast({ title: 'Éxito', description: successMessage });
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: `Error al ${actionName}`,
          description: e.message,
        });
      }
    });
  };

  if (loading || authLoading) {
    return <PageSpinner />;
  }
  
  if (error) {
    return <AppLayout><p className="p-4 text-destructive">Error: {error.message}</p></AppLayout>;
  }

  if (!order) {
    return <AppLayout><p className="p-4">Orden no encontrada.</p></AppLayout>;
  }
  
  if (user && companyId && order.companyId !== companyId) {
     return <AppLayout><p className="p-4">No tienes permiso para ver esta orden.</p></AppLayout>;
  }

  const canReserve = ['created', 'received'].includes(order.status);
  const canConfirmPick = ['created', 'received', 'picking'].includes(order.status);

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Orden #{order.orderNumber}</h1>
          <div className="flex items-center space-x-2">
            <Select onValueChange={(value) => handleStatusChange(value as OrderStatus)} value={order.status} disabled={isUpdatingStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cambiar estado" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(isUpdatingStatus || isPickingActionPending) && <Loader2 className="animate-spin" />}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader><CardTitle>Estado Actual</CardTitle></CardHeader>
            <CardContent><Badge variant={order.status === 'cancelled' ? 'destructive' : 'default'}>{order.status}</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Fecha Promesa</CardTitle></CardHeader>
            <CardContent>{order.promiseAt ? format(order.promiseAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Prioridad</CardTitle></CardHeader>
            <CardContent>{order.priority}</CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Almacén</CardTitle></CardHeader>
            <CardContent>{order.warehouseId}</CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ítems de la Orden</CardTitle>
              <div className="flex items-center space-x-2 pt-2">
                <Button 
                    onClick={() => handlePickingAction('reserve')} 
                    disabled={!canReserve || isPickingActionPending}
                >
                  Reservar Stock
                </Button>
                 <Button 
                    onClick={() => handlePickingAction('confirm')} 
                    disabled={!canConfirmPick || isPickingActionPending}
                 >
                  Confirmar Picking
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                {order.items && order.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                    <p className="text-sm text-muted-foreground">Esta orden no tiene ítems.</p>
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Línea de Tiempo</CardTitle>
              <CardDescription>Historial de eventos para esta orden.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
