'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, ShoppingCart, Truck, CheckCircle, XCircle, PackageSearch, PackagePlus, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { OrderEvent } from '@/lib/types';

interface EventsPreviewTimelineProps {
    orderId: string;
}

const statusIcons: Record<string, React.ElementType> = {
  created: ShoppingCart,
  received: Package,
  picking: PackageSearch,
  packed: PackageCheck,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  info: PackagePlus,
  error: XCircle,
  default: Package,
};

export function EventsPreviewTimeline({ orderId }: EventsPreviewTimelineProps) {
    const [events, setEvents] = useState<OrderEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!orderId) {
            setEvents([]);
            return;
        }

        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/audit/order-events?orderId=${orderId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'No se pudieron cargar los eventos.');
                }
                const data = await response.json();
                setEvents(data.data);
            } catch (err: any) {
                setError(err.message);
                toast({ variant: 'destructive', title: 'Error', description: err.message });
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [orderId, toast]);

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /> Cargando eventos...</div>;
    }

    if (error) {
        return (
             <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Error al cargar la línea de tiempo</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (events.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <p>No se encontraron eventos para esta orden.</p>
                <p className="text-xs">Verifica que el ID de la orden sea correcto.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 border rounded-lg p-4">
            {events.map((event, idx) => {
                const Icon = statusIcons[event.type] || statusIcons.default;
                return (
                    <div key={event.id || idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </span>
                            {idx < events.length - 1 && <div className="h-full w-px bg-border my-1" />}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{event.message}</p>
                            <p className="text-xs text-muted-foreground">
                                {event.createdAt ? format(new Date(event.createdAt), "d MMM yyyy, HH:mm", { locale: es }) : '...'}
                                {event.createdBy && ` por ${event.createdBy.substring(0, 12)}...`}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
