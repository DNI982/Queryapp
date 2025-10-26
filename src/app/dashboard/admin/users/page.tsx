'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  role: 'super-admin' | 'user' | 'pending-approval';
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const usersColRef = collection(firestore, 'users');
    const unsubscribe = onSnapshot(usersColRef, (snapshot) => {
      const userList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as UserProfile)
      );
      setUsers(userList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleApprove = async (userId: string) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    
    const userDocRef = doc(firestore, 'users', userId);
    batch.update(userDocRef, { role: 'user' });

    const pendingUserDocRef = doc(firestore, 'pendingUsers', userId);
    batch.delete(pendingUserDocRef);

    try {
        await batch.commit();
        toast({
            title: 'Usuario Aprobado',
            description: `El usuario ha sido aprobado y ahora tiene acceso.`,
        });
    } catch (error) {
        console.error("Error approving user: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo aprobar al usuario.',
        });
    }
  };

  const handleDeny = async (userId: string, userEmail: string) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);

    const userDocRef = doc(firestore, 'users', userId);
    batch.delete(userDocRef);

    const pendingUserDocRef = doc(firestore, 'pendingUsers', userId);
    batch.delete(pendingUserDocRef);

    try {
        await batch.commit();
        toast({
            title: 'Usuario Denegado',
            description: `La solicitud de ${userEmail} ha sido denegada y eliminada.`,
        });
    } catch (error) {
        console.error("Error denying user: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo denegar la solicitud del usuario.',
        });
    }
  }
  
  const handleMakeAdmin = async (userId: string) => {
      if (!firestore) return;
      const userDocRef = doc(firestore, 'users', userId);
      try {
          await updateDoc(userDocRef, { role: 'super-admin' });
          toast({
              title: 'Rol de usuario actualizado',
              description: 'El usuario ahora es un super-admin.',
          });
      } catch(error) {
          console.error("Error making user admin: ", error);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'No se pudo actualizar el rol del usuario.',
          });
      }
  };
  
  const getBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'super-admin':
        return 'default';
      case 'user':
        return 'secondary';
      case 'pending-approval':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getIconForRole = (role: UserProfile['role']) => {
      switch(role) {
          case 'super-admin': return <Shield className="mr-2 h-4 w-4" />;
          case 'user': return <User className="mr-2 h-4 w-4" />;
          case 'pending-approval': return <CheckCircle className="mr-2 h-4 w-4 text-amber-500" />;
          default: return null;
      }
  }

  const filteredUsers = (role: UserProfile['role'] | 'all') => {
      if (role === 'all') return users;
      return users.filter(user => user.role === role);
  }

  const renderUserTable = (userList: UserProfile[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center">
              Cargando usuarios...
            </TableCell>
          </TableRow>
        ) : userList.length > 0 ? (
          userList.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.displayName}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(user.role)}>
                    {getIconForRole(user.role)}
                    {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                {user.role === 'pending-approval' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-600"
                      onClick={() => handleApprove(user.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/0 hover:bg-red-500/20">
                            <XCircle className="mr-2 h-4 w-4" />
                            Denegar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción denegará el acceso al usuario y eliminará su solicitud. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeny(user.id, user.email)}>Denegar Acceso</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                 {user.role === 'user' && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Shield className="mr-2 h-4 w-4" />
                            Hacer Admin
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Hacer Super Administrador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto le dará al usuario control total sobre la administración de usuarios y otras áreas críticas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleMakeAdmin(user.id)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center">
              No hay usuarios en esta categoría.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Administración de Usuarios
        </h1>
        <p className="text-muted-foreground">
          Gestione los roles y el acceso de los usuarios al sistema.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Apruebe, deniegue o cambie los roles de los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-4">
                    <TabsTrigger value="pending">Pendientes ({filteredUsers('pending-approval').length})</TabsTrigger>
                    <TabsTrigger value="users">Usuarios ({filteredUsers('user').length})</TabsTrigger>
                    <TabsTrigger value="admins">Admins ({filteredUsers('super-admin').length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    {renderUserTable(filteredUsers('pending-approval'))}
                </TabsContent>
                <TabsContent value="users">
                    {renderUserTable(filteredUsers('user'))}
                </TabsContent>
                <TabsContent value="admins">
                    {renderUserTable(filteredUsers('super-admin'))}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    