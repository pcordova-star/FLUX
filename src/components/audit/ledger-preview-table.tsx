'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileWarning } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { InventoryLedger } from '@/lib/types';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface LedgerPreviewTableProps {
    filters: { from?: string; to?: string; warehouseId?: string };
}

const typeColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    inbound: 'default',
    pick: 'secondary',
    transfer: 'secondary',
    adjustment: 'secondary',
    reserve: 'secondary',
    outbound: 'destructive',
};

export function LedgerPreviewTable({ filters }: LedgerPreviewTableProps) {
    const [records, setRecords] = useState<InventoryLedger[]>([]);
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
                // if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);

                const response = await fetch(`/api/audit/ledger?${params.toString()}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'No se pudieron cargar los registros.');
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
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /> Cargando movimientos...</div>;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Error al cargar registros</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (records.length === 0) {
        return <div className="text-center py-6 text-muted-foreground border rounded-lg">No se encontraron movimientos para los filtros seleccionados.</div>;
    }

    return (
        <ScrollArea className="h-96 w-full rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Almacén</TableHead>
                        <TableHead className="text-right">Delta</TableHead>
                        <TableHead>Referencia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell className="whitespace-nowrap">
                                {record.createdAt ? format(new Date(record.createdAt), 'dd MMM, HH:mm', { locale: es }) : 'N/A'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={typeColors[record.type] || 'secondary'}>{record.type}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{record.sku}</TableCell>
                            <TableCell>{record.warehouseId}</TableCell>
                            <TableCell className={`text-right font-semibold ${record.deltaQty && record.deltaQty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {record.deltaQty}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{record.refType} {record.relatedOrderId?.substring(0,6)}...</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
}
