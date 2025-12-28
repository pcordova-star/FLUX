'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Box,
  Users,
  LogOut,
  ShieldCheck,
  UserCircle,
  BookText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PageSpinner from './page-spinner';
import { can } from '@/lib/permissions';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiredRole: 'viewer' },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart, requiredRole: 'viewer' },
  { href: '/inventory', label: 'Inventario', icon: Package, requiredRole: 'viewer' },
  { href: '/audit', label: 'Auditoría', icon: BookText, requiredRole: 'operator' },
  { href: '/warehouses', label: 'Almacenes', icon: Warehouse, requiredRole: 'admin' },
  { href: '/products', label: 'Productos', icon: Box, requiredRole: 'admin' },
  { href: '/users', label: 'Usuarios', icon: Users, requiredRole: 'admin' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, appUser, role, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    
    // Route protection based on role
    if (!loading && user && appUser) {
      if (pathname.startsWith('/admin') && !can(role, 'admin:view:console')) {
        router.replace('/dashboard');
      }
    }
  }, [user, appUser, role, loading, router, pathname]);

  if (loading || !user || !appUser) {
    return <PageSpinner />;
  }

  const handleLogout = async () => {
    //TODO: Call server action to revoke session
    await logout();
    router.push('/login');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <AppLogo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold">FLUX Wems</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
                can(role, item.requiredRole) && (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        asChild
                        >
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            ))}
            {can(role, 'admin:view:console') && (
              <SidebarMenuItem>
                 <SidebarMenuButton
                    isActive={pathname.startsWith('/admin')}
                    asChild
                  >
                   <Link href="/admin/seed">
                    <ShieldCheck />
                    <span>Admin</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium leading-none">
                      {appUser.displayName || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none">
                      {appUser.email}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{appUser.displayName || 'Usuario'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {appUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:hidden">
            <SidebarTrigger />
            <span className="font-semibold">FLUX Wems</span>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
