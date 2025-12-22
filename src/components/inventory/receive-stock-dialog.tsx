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
import { receiveStock } from '@/lib/inventory/inventoryService';
import { Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';


interface ReceiveStockDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
  clientId: z.string().min(1, 'El ID de cliente es requerido.'),
  warehouseId: z.string().min(1, 'El ID de almacén es requerido.'),
  sku: z.string().min(1, 'El SKU es requerido.'),
  qty: z.coerce.number().int().positive('La cantidad debe ser un número positivo.'),
  note: z.string().optional(),
});

export function ReceiveStockDialog({ isOpen, onOpenChange }: ReceiveStockDialogProps) {
  const { user, companyId } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      warehouseId: '',
      sku: '',
      note: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.uid || !companyId || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'No se pudo verificar la información del usuario. Por favor, inicia sesión de nuevo.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await receiveStock(firestore, {
        ...values,
        companyId,
      }, user.uid);

      toast({
        title: 'Éxito',
        description: 'El stock ha sido recibido correctamente.',
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al recibir stock',
        description: error.message || 'Ocurrió un error desconocido.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recibir Stock</DialogTitle>
          <DialogDescription>Registra una entrada de inventario manual.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
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
                  <FormLabel>Cantidad</FormLabel>
                   <FormControl>
                    <Input type="number" placeholder="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de Almacén</FormLabel>
                   <FormControl>
                    <Input placeholder="wh_scl_01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de Cliente</FormLabel>
                   <FormControl>
                    <Input placeholder="client_klog_001" {...field} />
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
                    <Textarea placeholder="Ej: Recepción de proveedor ABC" {...field} />
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
                Registrar Entrada
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
