'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsAppearancePage() {
  
  return (
     <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>
            Personaliza la apariencia de la aplicación. Cambia entre el modo claro y oscuro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className='text-sm text-muted-foreground'>La configuración para cambiar el tema (claro/oscuro) estará disponible aquí en una futura versión.</p>
        </CardContent>
      </Card>
    </div>
  );
}
