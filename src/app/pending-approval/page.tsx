'use client';
import { useAuthActions } from '@/firebase/client-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { MailCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function PendingApprovalPage() {
    const { signOut } = useAuthActions();
    const router = useRouter();
    const { user } = useUser();

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MailCheck className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">Revisión Pendiente</CardTitle>
                    <CardDescription>
                        Tu cuenta ha sido registrada, pero está pendiente de aprobación por un administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Recibirás una notificación por correo electrónico una vez que tu cuenta sea aprobada.
                        Si tienes alguna pregunta, por favor contacta con el soporte.
                    </p>
                    <p className="text-sm font-medium">Has iniciado sesión como: <br/><strong>{user?.email}</strong></p>
                    <Button onClick={handleLogout} variant="outline" className="w-full">
                        Cerrar Sesión
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
