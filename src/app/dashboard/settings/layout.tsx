'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === '/dashboard/settings/appearance') {
      return 'appearance';
    }
    return 'profile';
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestione la configuración de su cuenta y sus preferencias.
        </p>
      </div>

      <Tabs value={getActiveTab()} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="profile" asChild>
            <Link href="/dashboard/settings">Perfil</Link>
          </TabsTrigger>
          <TabsTrigger value="appearance" asChild>
            <Link href="/dashboard/settings/appearance">Apariencia</Link>
          </TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
