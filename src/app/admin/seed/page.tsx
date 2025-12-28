'use client';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2, DatabaseZap, Terminal, ShieldAlert } from 'lucide-react';
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

        if (!response.ok) {
            let result;
            let rawText = '';
            try {
                result = await response.json();
            } catch (e) {
                // If parsing JSON fails, the response might be plain text
                rawText = await response.text();
                console.error('[Seed] Failed to parse JSON response. Raw text:', rawText);
            }
            
            console.error('[Seed] Non-OK response:', {
              status: response.status,
              result: result,
              rawText: rawText
            });

            // Special handling for 403 Forbidden - seed disabled in dev
            if (response.status === 403) {
                 toast({
                    variant: 'default',
                    title: 'Operación Deshabilitada en Desarrollo',
                    description: result.message || 'El seed solo está disponible en el entorno de producción (App Hosting).',
                });
                return; // Stop further processing
            }

            // Special handling for 409 Conflict
            if (response.status === 409) {
                toast({
                    variant: 'default',
                    title: 'Operación Omitida',
                    description: result.message || 'La base de datos ya fue inicializada.',
                });
                return; // Stop further processing
            }

            const errorMessage = result?.message || rawText || `Error del servidor: ${response.status}`;
            const errorCause = result?.details ? JSON.stringify(result.details, null, 2) : 'No hay detalles adicionales.';
            
            setErrorDetails(errorCause);
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        toast({
          title: 'Éxito',
          description: result.message,
        });

      } catch (error: any) {
        console.error("Error calling seed API:", error);
        
        // Use existing errorDetails if already set, otherwise use error.message
        if (!errorDetails) {
            setErrorDetails(error.message || 'No hay detalles adicionales. Revisa los logs del servidor.');
        }

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
              Ejecuta este proceso para poblar la base de datos con una compañía, usuarios y datos de ejemplo.
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
             <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Disponibilidad de la Función</AlertTitle>
                <AlertDescription>
                 Por razones de seguridad y compatibilidad, la inicialización de datos solo está habilitada en el entorno de producción (después de desplegar en App Hosting).
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
