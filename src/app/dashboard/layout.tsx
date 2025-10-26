'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Database,
  DatabaseZap,
  History,
  LayoutGrid,
  Settings,
  BarChart2,
  MoreHorizontal,
  LogOut,
  Palette,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { QueryHistoryProvider } from '@/hooks/use-query-history';
import { useUser } from '@/firebase';
import { useAuthActions } from '@/firebase/client-provider';
import { useEffect } from 'react';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const { signOut } = useAuthActions();
  
  const isActive = (path: string) => pathname === path || (path.startsWith(pathname) && pathname !== '/dashboard');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);


  const menuItems = [
    { href: '/dashboard', label: 'Consultas', icon: DatabaseZap },
    { href: '/dashboard/data-sources', label: 'Fuentes de Datos', icon: Database },
    { href: '/dashboard/history', label: 'Historial', icon: History },
    { href: '/dashboard/analytics', label: 'Analíticas', icon: BarChart2 },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  }
  
  if (loading || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <QueryHistoryProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex h-14 items-center px-4">
              <Logo />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-auto">
                          <Avatar className="h-8 w-8">
                              {user?.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
                              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="text-left group-data-[collapsible=icon]:hidden">
                              <p className="font-medium text-sm truncate">{user?.displayName || 'Analista'}</p>
                              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                          <MoreHorizontal className="ml-auto group-data-[collapsible=icon]:hidden" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-56">
                      <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                       <DropdownMenuItem asChild>
                           <Link href="/dashboard/settings">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Configuración</span>
                           </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                          <Link href="/dashboard/settings/appearance">
                              <Palette className="mr-2 h-4 w-4" />
                              <span>Apariencia</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Cerrar Sesión</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">DataWise AI</h1>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </QueryHistoryProvider>
  );
}
