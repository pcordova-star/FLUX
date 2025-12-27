import { UserRole, USER_ROLES } from './types';

// Define todas las acciones posibles en la aplicación para tener un control tipado.
export const ACTIONS = [
  // Pedidos
  'order:create',
  'order:read',
  'order:update:status', // Cambiar estado, reservar, confirmar picking
  'order:delete',
  
  // Inventario
  'inventory:read',
  'inventory:move', // Registrar entradas, salidas o ajustes
  
  // Recursos Maestros (Productos, Almacenes)
  'product:read',
  'product:edit', // Crear, actualizar, eliminar
  'warehouse:read',
  'warehouse:edit',
  
  // Administración
  'user:manage', // Crear, actualizar, desactivar usuarios
  'admin:view:console', // Acceder a la consola de admin
] as const;

export type Action = typeof ACTIONS[number];

// Define los permisos para cada rol. Los roles superiores heredan los permisos de los inferiores.
const permissions: Record<UserRole, Action[]> = {
  viewer: [
    'order:read',
    'inventory:read',
    'product:read',
    'warehouse:read',
  ],
  operator: [
    ...USER_ROLES.filter(r => r === 'viewer').flatMap(r => permissions[r]),
    'order:create',
    'order:update:status',
    'inventory:move',
  ],
  admin: [
    ...USER_ROLES.filter(r => r === 'operator').flatMap(r => permissions[r]),
    'order:delete',
    'product:edit',
    'warehouse:edit',
    'user:manage',
  ],
  super_admin: [
    // super_admin puede hacer todo
  ],
};

/**
 * Verifica si un rol de usuario tiene permiso para realizar una acción específica.
 * @param role El rol del usuario.
 * @param action La acción que se quiere realizar.
 * @returns `true` si el usuario tiene permiso, `false` en caso contrario.
 */
export function can(role: UserRole | null, action: Action): boolean {
  if (!role) {
    return false;
  }

  // super_admin siempre tiene acceso total.
  if (role === 'super_admin') {
    return true;
  }
  
  const userPermissions = permissions[role];
  
  if (!userPermissions) {
    return false;
  }
  
  return userPermissions.includes(action);
}
