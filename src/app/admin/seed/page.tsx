'use client';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2, DatabaseZap, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SeedPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleSeed = () => {
    setErrorDetails(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/seed', {
          method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            // Special handling for 409 Conflict
            if (response.status === 409) {
                toast({
                    variant: 'default', // Not a destructive error
                    title: 'Operación Omitida',
                    description: result.message || 'La base de datos ya fue inicializada.',
                });
                return; // Stop further processing
            }
            // Throw an error for other bad responses to be caught by the catch block
            throw new Error(result.message || `Error ${response.status}`, { cause: result.details });
        }
        
        toast({
          title: 'Éxito',
          description: result.message,
        });

      } catch (error: any) {
        console.error("Error calling seed API:", error);
        if (error.cause) {
            console.error("Seed error details:", error.cause);
        }
        setErrorDetails(error.cause || 'No hay detalles adicionales. Revisa los logs del servidor.');
        toast({
          variant: 'destructive',
          title: 'Error al Inicializar',
          description: error.message || 'No se pudo completar la operación.',
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Consola de Administración</h1>
        </div>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Inicializar Base de Datos (Demo)</CardTitle>
            <CardDescription>
              Hemos cargado datos de ejemplo para que veas cómo funciona el sistema. Puedes eliminarlos cuando quieras.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Acción de Alto Privilegio</AlertTitle>
              <AlertDescription>
                Esta operación escribe directamente en la base de datos utilizando credenciales de administrador y solo debe ser ejecutada una vez en un proyecto nuevo.
              </AlertDescription>
            </Alert>

            {errorDetails && (
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Detalles del Error del Servidor</AlertTitle>
                    <AlertDescription className="text-xs font-mono whitespace-pre-wrap break-all">
                        {errorDetails}
                    </AlertDescription>
                </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              <p>
                Al hacer clic, se crearán atómicamente:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Una compañía de demostración.</li>
                <li>Tres usuarios con roles (admin, operator, viewer).</li>
                <li>Un almacén principal.</li>
                <li>Tres productos con diferentes niveles de stock.</li>
                <li>Dos órdenes de ejemplo (una abierta, una completada).</li>
                <li>Un snapshot de KPIs inicializado.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSeed} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DatabaseZap className="mr-2 h-4 w-4" />
              )}
              {isPending ? 'Inicializando...' : 'Poblar con Datos Demo'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
