'use client';
import { useUserRole } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Users, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && role !== 'super-admin') {
      router.push('/dashboard');
    }
  }, [role, loading, router]);
  
  const getActiveTab = () => {
    if (pathname.startsWith('/dashboard/admin/permissions')) {
      return 'permissions';
    }
    return 'users';
  }

  if (loading || role !== 'super-admin') {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
        <p className="text-muted-foreground">
          Gestione usuarios, roles y permisos del sistema.
        </p>
      </div>
      <Tabs value={getActiveTab()} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="users" asChild>
            <Link href="/dashboard/admin/users"><Users className="mr-2 h-4 w-4" />Usuarios</Link>
          </TabsTrigger>
          <TabsTrigger value="permissions" asChild>
            <Link href="/dashboard/admin/permissions"><ShieldCheck className="mr-2 h-4 w-4" />Permisos</Link>
          </TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
