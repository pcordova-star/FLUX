'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/audit/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { can } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InventoryLedger, Order, OrderEvent } from '@/lib/types';
import { es } from 'date-fns/locale';

type ExportType = 'inventory-ledger' | 'orders' | 'order-events';

export default function AuditPage() {
    const { role } = useAuth();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const { toast } = useToast();

    const [ledgerData, setLedgerData] = useState<InventoryLedger[]>([]);
    const [ordersData, setOrdersData] = useState<Order[]>([]);
    const [orderEventsData, setOrderEventsData] = useState<OrderEvent[]>([]);
    
    const [orderIdForEvents, setOrderIdForEvents] = useState('');
    const [isLoadingPreview, setIsLoadingPreview] = useState<string | null>(null);

    const fetchData = async (type: 'ledger' | 'orders' | 'order-events', params: URLSearchParams) => {
        setIsLoadingPreview(type);
        try {
            const response = await fetch(`/api/audit/${type}?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}`);
            }
            const data = await response.json();
            if (type === 'ledger') setLedgerData(data);
            if (type === 'orders') setOrdersData(data);
            if (type === 'order-events') setOrderEventsData(data);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: `Error al cargar vista previa`,
                description: error.message,
            });
        } finally {
            setIsLoadingPreview(null);
        }
    };
    
    useEffect(() => {
        const params = new URLSearchParams();
        if (dateRange?.from) params.append('from', dateRange.from.toISOString());
        if (dateRange?.to) params.append('to', dateRange.to.toISOString());
        
        fetchData('ledger', params);
        fetchData('orders', params);
    }, [dateRange]);

    const handleSearchOrderEvents = () => {
        if (!orderIdForEvents) {
            toast({ title: 'Atención', description: 'Por favor, introduce un ID de orden.' });
            return;
        }
        const params = new URLSearchParams();
        params.append('orderId', orderIdForEvents);
        fetchData('order-events', params);
    }

    const handleExport = async (type: ExportType, format: 'csv' | 'xlsx') => {
        const loadingKey = `${type}-${format}`;
        setIsLoading(loadingKey);
        try {
            const params = new URLSearchParams();
            params.append('format', format);
            if (dateRange?.from) params.append('from', dateRange.from.toISOString());
            if (dateRange?.to) params.append('to', dateRange.to.toISOString());
            
            // Special case for order-events export
            if (type === 'order-events') {
                if (!orderIdForEvents) {
                    throw new Error('Se requiere un ID de orden para exportar sus eventos.');
                }
                params.append('orderId', orderIdForEvents);
            }

            const response = await fetch(`/api/exports/${type}?${params.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `${type}-export.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
            }

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            toast({ title: 'Exportación iniciada', description: `Tu archivo ${filename} se está descargando.` });
        } catch (error: any) {
            console.error(`Error al exportar ${type}:`, error);
            toast({ variant: 'destructive', title: `Error al exportar`, description: error.message || 'Ocurrió un error inesperado.' });
        } finally {
            setIsLoading(null);
        }
    };
    
    const canExportXlsx = can(role, 'admin:view:console');

    const renderExportButtons = (type: ExportType) => (
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => handleExport(type, 'csv')} disabled={isLoading === `${type}-csv`}>
                {isLoading === `${type}-csv` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Exportar a CSV
            </Button>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={canExportXlsx ? undefined : 0}>
                            <Button onClick={() => handleExport(type, 'xlsx')} disabled={isLoading === `${type}-xlsx` || !canExportXlsx}>
                                {isLoading === `${type}-xlsx` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Exportar a Excel
                            </Button>
                        </span>
                    </TooltipTrigger>
                    {!canExportXlsx && <TooltipContent><p>Requiere rol de Operador o superior.</p></TooltipContent>}
                </Tooltip>
            </TooltipProvider>
        </div>
    );
    
    const renderSkeleton = () => (
        <div className="space-y-2 mt-4">
             <div className="h-8 w-full bg-muted rounded-md animate-pulse"></div>
             <div className="h-8 w-full bg-muted rounded-md animate-pulse"></div>
             <div className="h-8 w-full bg-muted rounded-md animate-pulse"></div>
        </div>
    );


    return (
        <AppLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Auditoría y Exportes</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filtros Globales</CardTitle>
                        <CardDescription>Define el rango de fechas para las vistas previas y los exportes. Usa rangos acotados para un mejor rendimiento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Rango de Fechas</Label>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="ledger">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="ledger">Movimientos</TabsTrigger>
                        <TabsTrigger value="orders">Pedidos</TabsTrigger>
                        <TabsTrigger value="events">Eventos de Pedido</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ledger">
                        <Card>
                            <CardHeader><CardTitle>Vista Previa de Movimientos de Inventario</CardTitle></CardHeader>
                            <CardContent>
                                {isLoadingPreview === 'ledger' ? renderSkeleton() : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Almacén</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead>Cantidad</TableHead>
                                                <TableHead>Ref</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ledgerData.length > 0 ? ledgerData.map((entry, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{entry.createdAt ? format(new Date(entry.createdAt.seconds * 1000), 'Pp', { locale: es }) : ''}</TableCell>
                                                    <TableCell className="font-medium">{entry.sku}</TableCell>
                                                    <TableCell>{entry.warehouseId}</TableCell>
                                                    <TableCell><Badge variant="outline">{entry.type}</Badge></TableCell>
                                                    <TableCell className={entry.deltaQty && entry.deltaQty < 0 ? "text-destructive" : ""}>{entry.deltaQty ?? entry.reservedDeltaQty}</TableCell>
                                                    <TableCell>{entry.refType} {entry.relatedOrderId || entry.transferId}</TableCell>
                                                </TableRow>
                                            )) : <TableRow><TableCell colSpan={6} className="text-center">No hay movimientos en el rango seleccionado.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                )}
                                {renderExportButtons('inventory-ledger')}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="orders">
                        <Card>
                            <CardHeader><CardTitle>Vista Previa de Pedidos</CardTitle></CardHeader>
                            <CardContent>
                                {isLoadingPreview === 'orders' ? renderSkeleton() : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nº Orden</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Almacén</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Fecha Creado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ordersData.length > 0 ? ordersData.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                                    <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                                    <TableCell>{order.warehouseId}</TableCell>
                                                    <TableCell>{order.totalItems}</TableCell>
                                                    <TableCell>{order.createdAt ? format(new Date(order.createdAt.seconds * 1000), 'Pp', { locale: es }) : ''}</TableCell>
                                                </TableRow>
                                            )) : <TableRow><TableCell colSpan={5} className="text-center">No hay pedidos en el rango seleccionado.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                )}
                                {renderExportButtons('orders')}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="events">
                        <Card>
                            <CardHeader><CardTitle>Eventos de un Pedido Específico</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex w-full max-w-sm items-center space-x-2">
                                    <Input 
                                        type="text" 
                                        placeholder="ID de la Orden" 
                                        value={orderIdForEvents}
                                        onChange={(e) => setOrderIdForEvents(e.target.value)}
                                    />
                                    <Button type="button" onClick={handleSearchOrderEvents} disabled={isLoadingPreview === 'order-events'}>
                                        {isLoadingPreview === 'order-events' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>
                                
                                {isLoadingPreview === 'order-events' ? renderSkeleton() : (
                                   <div className="mt-4 space-y-4">
                                       {orderEventsData.length > 0 ? orderEventsData.map((event, idx) => (
                                           <div key={idx} className="flex gap-4">
                                               <div>
                                                   <p className="font-medium">{event.message}</p>
                                                   <p className="text-sm text-muted-foreground">
                                                       {event.createdAt ? format(new Date(event.createdAt.seconds * 1000), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es }) : ''} por {event.createdBy}
                                                   </p>
                                               </div>
                                           </div>
                                       )) : <p className="text-sm text-muted-foreground mt-4">Introduce un ID de orden y pulsa buscar para ver sus eventos.</p>}
                                   </div>
                                )}
                                {renderExportButtons('order-events')}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
