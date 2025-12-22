'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, CalendarIcon, PlusCircle, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ORDER_PRIORITIES, type OrderPriority } from '@/lib/types';
import { Separator } from '../ui/separator';

interface CreateOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const itemSchema = z.object({
  sku: z.string().trim().min(1, 'SKU es requerido.'),
  qty: z.coerce.number().int().positive('Cantidad debe ser un número entero positivo.'),
});

const formSchema = z.object({
  orderNumber: z.string().min(1, 'El número de orden es requerido.'),
  clientId: z.string()
    .min(3, 'El ID de cliente debe tener al menos 3 caracteres.')
    .regex(/^\S*$/, 'El ID de cliente no puede contener espacios.'),
  warehouseId: z.string()
    .min(3, 'El ID de almacén debe tener al menos 3 caracteres.')
    .regex(/^\S*$/, 'El ID de almacén no puede contener espacios.'),
  priority: z.enum(ORDER_PRIORITIES),
  promiseAt: z.date({
    required_error: "La fecha promesa es requerida.",
  }),
  items: z.array(itemSchema).min(1, 'La orden debe tener al menos un ítem.'),
});

export function CreateOrderDialog({ isOpen, onOpenChange }: CreateOrderDialogProps) {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: '',
      clientId: '',
      warehouseId: '',
      priority: 'scheduled',
      items: [{ sku: '', qty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.uid || !companyId) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'No se pudo verificar la información del usuario o la compañía. Por favor, inicia sesión de nuevo.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await createOrder({
        ...values,
        companyId,
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
  
  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      form.reset({
        orderNumber: '',
        clientId: '',
        warehouseId: '',
        priority: 'scheduled',
        promiseAt: undefined,
        items: [{ sku: '', qty: 1 }],
      });
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Nueva Orden</DialogTitle>
          <DialogDescription>Completa los detalles para crear una nueva orden.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
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
                      {ORDER_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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

            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Ítems</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.sku`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className={cn(index !== 0 && "sr-only")}>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="SKU-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.qty`}
                      render={({ field }) => (
                        <FormItem className="w-28">
                          <FormLabel className={cn(index !== 0 && "sr-only")}>Cantidad</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-8"
                      disabled={fields.length <= 1}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Eliminar ítem</span>
                    </Button>
                  </div>
                ))}
              </div>
               <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ sku: '', qty: 1 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Ítem
              </Button>
               {form.formState.errors.items && !form.formState.errors.items.root && (
                 <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.items.message}</p>
               )}
            </div>

            <DialogFooter className="pt-4">
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
