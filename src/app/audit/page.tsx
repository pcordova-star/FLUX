'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/audit/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { can } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { LedgerPreviewTable } from '@/components/audit/ledger-preview-table';
import { OrdersPreviewTable } from '@/components/audit/orders-preview-table';
import { EventsPreviewTimeline } from '@/components/audit/events-preview-timeline';

type ExportType = 'inventory-ledger' | 'orders' | 'order-events';
type TabValue = 'ledger' | 'orders' | 'events';

export default function AuditPage() {
    const { role } = useAuth();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -7),
        to: new Date(),
    });
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const { toast } = useToast();
    const [orderId, setOrderId] = useState('');
    const [activeTab, setActiveTab] = useState<TabValue>('ledger');
    
    // Memoize the filters to prevent re-renders of preview components
    const previewFilters = useMemo(() => ({
        from: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
        to: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
    }), [dateRange]);

    const handleOrderSelect = (selectedOrderId: string) => {
        setOrderId(selectedOrderId);
        setActiveTab('events');
    };

    const handleExport = async (type: ExportType, format: 'csv' | 'xlsx') => {
        const loadingKey = `${type}-${format}`;
        setIsLoading(loadingKey);
        try {
            const params = new URLSearchParams();
            params.append('format', format);
            if (dateRange?.from) params.append('from', startOfDay(dateRange.from).toISOString());
            if (dateRange?.to) params.append('to', endOfDay(dateRange.to).toISOString());
            
            if (type === 'order-events') {
                if (!orderId) {
                    throw new Error('Se requiere un ID de orden para exportar sus eventos.');
                }
                params.append('orderId', orderId);
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
    
    const canExportXlsx = can(role, 'operator');

    const renderExportButtons = (type: ExportType, requiresOrderId = false) => (
        <CardFooter className="flex-col items-start gap-4 bg-muted/50 border-t">
            <p className="text-xs text-muted-foreground pt-4">Los exportes grandes pueden demorar. Usa rangos de fecha acotados para obtener resultados más rápido.</p>
            <div className="flex justify-end gap-2 w-full">
                <Button variant="secondary" onClick={() => handleExport(type, 'csv')} disabled={isLoading === `${type}-csv` || (requiresOrderId && !orderId)}>
                    {isLoading === `${type}-csv` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar a CSV
                </Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span tabIndex={canExportXlsx ? undefined : 0}>
                                <Button onClick={() => handleExport(type, 'xlsx')} disabled={isLoading === `${type}-xlsx` || !canExportXlsx || (requiresOrderId && !orderId)}>
                                    {isLoading === `${type}-xlsx` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Exportar a Excel
                                </Button>
                            </span>
                        </TooltipTrigger>
                        {!canExportXlsx && <TooltipContent><p>Requiere rol de Operador o superior.</p></TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
            </div>
        </CardFooter>
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
                        <CardDescription>Define el rango de fechas para las vistas previas y exportaciones. Por defecto, se consultan los últimos 7 días.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Rango de Fechas</Label>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="ledger">Movimientos</TabsTrigger>
                        <TabsTrigger value="orders">Pedidos</TabsTrigger>
                        <TabsTrigger value="events">Eventos de Pedido</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ledger">
                        <Card>
                            <CardHeader><CardTitle>Vista Previa de Movimientos de Inventario</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground -mt-4 mb-4">
                                    Últimos movimientos registrados en el libro mayor de inventario.
                                </p>
                                <LedgerPreviewTable filters={previewFilters} />
                            </CardContent>
                            <Separator />
                            <CardHeader className="pb-2 pt-6"><CardTitle className="text-lg">Exportar Libro Mayor</CardTitle></CardHeader>
                            {renderExportButtons('inventory-ledger')}
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="orders">
                        <Card>
                             <CardHeader><CardTitle>Vista Previa de Pedidos</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground -mt-4 mb-4">
                                    Últimos pedidos creados en el sistema. Haz clic en una fila para ver sus eventos.
                                </p>
                                <OrdersPreviewTable filters={previewFilters} onOrderSelect={handleOrderSelect} />
                            </CardContent>
                            <Separator />
                            <CardHeader className="pb-2 pt-6"><CardTitle className="text-lg">Exportar Pedidos</CardTitle></CardHeader>
                            {renderExportButtons('orders')}
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="events">
                        <Card>
                             <CardHeader><CardTitle>Vista Previa de Eventos de Pedido</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                               <p className="text-sm text-muted-foreground -mt-4">
                                    Introduce el ID de una orden para ver su línea de tiempo completa de eventos.
                                </p>
                                <div className="max-w-sm">
                                    <Label htmlFor="orderId">ID de la Orden</Label>
                                    <Input 
                                        id="orderId"
                                        type="text" 
                                        placeholder="Introduce el ID exacto de la orden" 
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                    />
                                </div>
                                {orderId && <EventsPreviewTimeline orderId={orderId} />}
                            </CardContent>
                            <Separator />
                            <CardHeader className="pb-2 pt-6"><CardTitle className="text-lg">Exportar Eventos de Pedido</CardTitle></CardHeader>
                            {renderExportButtons('order-events', true)}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
