import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestione la configuración de su cuenta y sus preferencias.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Realice cambios en su información pública aquí.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" defaultValue="Analista" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="analista@datawise.ai" />
              </div>
              <Button>Guardar cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className='text-sm text-muted-foreground'>La configuración de la apariencia estará disponible aquí.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
