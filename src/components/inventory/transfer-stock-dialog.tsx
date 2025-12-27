'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useFirebase } from '@/context/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { transferStock } from '@/lib/inventory/transferService';
import { Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';


interface TransferStockDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es requerido.'),
  qty: z.coerce.number().int().positive('La cantidad debe ser un número positivo.'),
  fromWarehouseId: z.string().trim().min(1, 'El almacén de origen es requerido.'),
  toWarehouseId: z.string().trim().min(1, 'El almacén de destino es requerido.'),
  clientId: z.string().trim().min(1, 'El ID de cliente es requerido.'),
  note: z.string().optional(),
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
    message: "El almacén de origen y destino no pueden ser iguales.",
    path: ["toWarehouseId"], // Path to the field to attach the error to.
});

export function TransferStockDialog({ isOpen, onOpenChange }: TransferStockDialogProps) {
  const { user, companyId } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: '',
      qty: 1,
      fromWarehouseId: '',
      toWarehouseId: '',
      clientId: 'default', // Default client for simplicity
      note: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.uid || !companyId || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'No se pudo verificar la información del usuario.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await transferStock(firestore, {
        ...values,
        companyId,
      }, user.uid);

      toast({
        title: 'Transferencia Exitosa',
        description: `${values.qty} unidades de ${values.sku} transferidas de ${values.fromWarehouseId} a ${values.toWarehouseId}.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error en la Transferencia',
        description: error.message || 'Ocurrió un error desconocido. Verifica el stock disponible y los IDs.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Stock entre Almacenes</DialogTitle>
          <DialogDescription>Mueve inventario de una ubicación a otra. Esto se registrará como una salida y una entrada atómica.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU del Producto</FormLabel>
                  <FormControl>
                    <Input placeholder="PROD-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a Transferir</FormLabel>
                   <FormControl>
                    <Input type="number" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="fromWarehouseId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Almacén Origen</FormLabel>
                    <FormControl>
                        <Input placeholder="wh_scl" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="toWarehouseId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Almacén Destino</FormLabel>
                    <FormControl>
                        <Input placeholder="wh_valpo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
             </div>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de Cliente (Dueño)</FormLabel>
                   <FormControl>
                    <Input {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (Opcional)</FormLabel>
                   <FormControl>
                    <Textarea placeholder="Ej: Transferencia por quiebre de stock" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar Transferencia
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
