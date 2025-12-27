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
import { createProduct } from '@/lib/products/productsService';
import { Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface CreateProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es requerido.'),
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative('El precio no puede ser negativo.'),
});

export function CreateProductDialog({ isOpen, onOpenChange }: CreateProductDialogProps) {
  const { user, companyId } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      price: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !companyId || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo verificar la autenticación.' });
      return;
    }
    setIsLoading(true);
    try {
      await createProduct(firestore, { ...values, companyId });
      toast({ title: 'Éxito', description: 'Producto creado correctamente.' });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al crear producto', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>Añade un nuevo producto a tu catálogo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Identificador Único)</FormLabel>
                  <FormControl><Input placeholder="LAPTOP-PRO-X1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl><Input placeholder="Laptop Profesional X1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Describe el producto..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Producto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
