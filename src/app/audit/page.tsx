'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/audit/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { can } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type ExportType = 'inventory-ledger' | 'orders';

export default function AuditPage() {
    const { role } = useAuth();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const { toast } = useToast();

    const handleExport = async (type: ExportType, format: 'csv' | 'xlsx') => {
        const loadingKey = `${type}-${format}`;
        setIsLoading(loadingKey);
        try {
            const params = new URLSearchParams();
            params.append('format', format);
            if (dateRange?.from) {
                params.append('from', dateRange.from.toISOString());
            }
            if (dateRange?.to) {
                params.append('to', dateRange.to.toISOString());
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
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            toast({
                title: 'Exportación iniciada',
                description: `Tu archivo ${filename} se está descargando.`,
            });
        } catch (error: any) {
            console.error(`Error al exportar ${type}:`, error);
            toast({
                variant: 'destructive',
                title: `Error al exportar ${type}`,
                description: error.message || 'Ocurrió un error inesperado.',
            });
        } finally {
            setIsLoading(null);
        }
    };
    
    const canExportXlsx = can(role, 'admin:view:console');

    const renderExportCard = (type: ExportType, title: string, description: string) => (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Selecciona un rango de fechas y el formato deseado.</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button 
                    variant="secondary"
                    onClick={() => handleExport(type, 'csv')}
                    disabled={isLoading === `${type}-csv`}
                >
                    {isLoading === `${type}-csv` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar a CSV
                </Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span tabIndex={canExportXlsx ? undefined : 0}>
                                <Button
                                    onClick={() => handleExport(type, 'xlsx')}
                                    disabled={isLoading === `${type}-xlsx` || !canExportXlsx}
                                >
                                    {isLoading === `${type}-xlsx` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Exportar a Excel
                                </Button>
                            </span>
                        </TooltipTrigger>
                         {!canExportXlsx && (
                            <TooltipContent>
                                <p>Disponible para roles de Operador o superior.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );

    return (
        <AppLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Auditoría y Exportes</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filtros Globales de Exportación</CardTitle>
                        <CardDescription>Define el rango de fechas para todos los informes que generes desde esta página. Los exportes grandes pueden demorar; usa rangos acotados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Rango de Fechas</Label>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    {renderExportCard(
                        'inventory-ledger',
                        'Libro Mayor de Inventario',
                        'Exporta todos los movimientos de entrada, salida, ajustes y transferencias.'
                    )}
                    {renderExportCard(
                        'orders',
                        'Pedidos',
                        'Exporta el listado completo de pedidos con sus estados y detalles principales.'
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
