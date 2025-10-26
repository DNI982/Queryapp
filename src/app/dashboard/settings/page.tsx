'use client';

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
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');


export default function SettingsProfilePage() {
    const { toast } = useToast();
    
    const handleSaveChanges = () => {
        toast({
            title: "Cambios guardados",
            description: "Tu perfil ha sido actualizado correctamente.",
        });
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Realice cambios en su información pública aquí. Haga clic en guardar cuando haya terminado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                    {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
                    <AvatarFallback>AV</AvatarFallback>
                </Avatar>
                <Button variant="outline">Cambiar foto</Button>
            </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" defaultValue="Analista" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="analista@datawise.ai" readOnly />
          </div>
          <Button onClick={handleSaveChanges}>Guardar cambios</Button>
        </CardContent>
      </Card>
    </div>
  );
}
