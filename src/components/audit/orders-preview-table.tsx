'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileWarning } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { Order } from '@/lib/types';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface OrdersPreviewTableProps {
    filters: { from?: string; to?: string };
    onOrderSelect: (orderId: string) => void;
}

export function OrdersPreviewTable({ filters, onOrderSelect }: OrdersPreviewTableProps) {
    const [records, setRecords] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (filters.from) params.append('from', filters.from);
                if (filters.to) params.append('to', filters.to);

                const response = await fetch(`/api/audit/orders?${params.toString()}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'No se pudieron cargar los pedidos.');
                }
                const data = await response.json();
                setRecords(data.data);
            } catch (err: any) {
                setError(err.message);
                toast({ variant: 'destructive', title: 'Error', description: err.message });
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [filters, toast]);

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /> Cargando pedidos...</div>;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Error al cargar pedidos</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (records.length === 0) {
        return <div className="text-center py-6 text-muted-foreground border rounded-lg">No se encontraron pedidos para los filtros seleccionados.</div>;
    }

    return (
        <ScrollArea className="h-96 w-full rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                        <TableHead>Nº Orden</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Almacén</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record) => (
                        <TableRow key={record.id} onClick={() => onOrderSelect(record.id)} className="cursor-pointer">
                            <TableCell className="font-medium">{record.orderNumber}</TableCell>
                            <TableCell>
                                <Badge variant={record.status === 'cancelled' || record.status === 'delivered' ? 'default' : 'secondary'}>
                                    {record.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{record.warehouseId}</TableCell>
                            <TableCell className="whitespace-nowrap">
                                {record.createdAt ? format(new Date(record.createdAt), 'dd MMM yyyy, HH:mm', { locale: es }) : 'N/A'}
                            </TableCell>
                             <TableCell className="text-right">{record.totalItems}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
}
