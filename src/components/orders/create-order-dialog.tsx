'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/lib/orders/ordersService';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface CreateOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
  orderNumber: z.string().min(1, 'El número de orden es requerido.'),
  clientId: z.string().min(1, 'El cliente es requerido.'),
  warehouseId: z.string().min(1, 'El almacén es requerido.'),
  priority: z.enum(['low', 'medium', 'high']),
  promiseAt: z.date({
    required_error: "La fecha promesa es requerida.",
  }),
});

export function CreateOrderDialog({ isOpen, onOpenChange }: CreateOrderDialogProps) {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: '',
      clientId: 'dummy-client-id', // Placeholder
      warehouseId: 'dummy-warehouse-id', // Placeholder
      priority: 'medium',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !companyId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
      return;
    }
    setIsLoading(true);
    try {
      await createOrder({
        ...values,
        companyId,
        promiseAt: Timestamp.fromDate(values.promiseAt),
      }, user.uid);

      toast({
        title: 'Éxito',
        description: 'La orden ha sido creada correctamente.',
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al crear la orden',
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
          <DialogTitle>Crear Nueva Orden</DialogTitle>
          <DialogDescription>Completa los detalles para crear una nueva orden.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="orderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Orden</FormLabel>
                  <FormControl>
                    <Input placeholder="PO-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* TODO: Replace with actual client and warehouse selectors */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                   <Input {...field} disabled />
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Almacén</FormLabel>
                   <Input {...field} disabled />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="promiseAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Promesa</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0,0,0,0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                Crear Orden
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
