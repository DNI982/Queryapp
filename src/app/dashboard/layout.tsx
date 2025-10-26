'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { href: '/dashboard', label: 'Consultas', icon: DatabaseZap },
    { href: '/dashboard/data-sources', label: 'Fuentes de Datos', icon: Database },
    { href: '/dashboard/history', label: 'Historial', icon: History },
    { href: '/dashboard/analytics', label: 'Analíticas', icon: BarChart2 },
    { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-12 items-center px-4">
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
                            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
                            <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                        <div className="text-left group-data-[collapsible=icon]:hidden">
                            <p className="font-medium text-sm">Analista</p>
                            <p className="text-xs text-muted-foreground">analista@datawise.ai</p>
                        </div>
                        <MoreHorizontal className="ml-auto group-data-[collapsible=icon]:hidden" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuración</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-4 border-b bg-card px-4 md:hidden">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">DataWise AI</h1>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
