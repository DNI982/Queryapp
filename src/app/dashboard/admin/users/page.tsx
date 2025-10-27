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
import { CheckCircle, XCircle, Shield, User, MoreVertical, Briefcase, Database } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent
  } from "@/components/ui/dropdown-menu"
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type UserRole = 'super-admin' | 'admin' | 'db-manager' | 'db-analyst' | 'pending-approval';

type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  requestedRole?: Exclude<UserRole, 'pending-approval'>;
};

const roleNames: Record<Exclude<UserRole, 'pending-approval'>, string> = {
    'super-admin': 'Superadministrador',
    'admin': 'Administrador',
    'db-manager': 'Gestor de Base de Datos',
    'db-analyst': 'Analista de Base de Datos'
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
    },
    (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleApprove = (userId: string, requestedRole: UserProfile['requestedRole']) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    
    const userDocRef = doc(firestore, 'users', userId);
    const userData = { role: requestedRole || 'db-analyst' };
    batch.update(userDocRef, userData);

    const pendingUserDocRef = doc(firestore, 'pendingUsers', userId);
    batch.delete(pendingUserDocRef);

    batch.commit()
        .then(() => {
            toast({
                title: 'Usuario Aprobado',
                description: `El usuario ha sido aprobado y ahora tiene el rol de ${roleNames[requestedRole || 'db-analyst']}.`,
            });
        })
        .catch(async (serverError) => {
             const permissionError = new FirestorePermissionError({
                path: `users/${userId} and pendingUsers/${userId}`,
                operation: 'update',
                requestResourceData: { user: userData },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleDeny = (userId: string, userEmail: string) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);

    const userDocRef = doc(firestore, 'users', userId);
    batch.delete(userDocRef);

    const pendingUserDocRef = doc(firestore, 'pendingUsers', userId);
    batch.delete(pendingUserDocRef);

    batch.commit()
        .then(() => {
            toast({
                title: 'Usuario Denegado',
                description: `La solicitud de ${userEmail} ha sido denegada y eliminada.`,
            });
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: `users/${userId} and pendingUsers/${userId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  }
  
  const handleRoleChange = (userId: string, role: Exclude<UserRole, 'pending-approval'>) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    const newRole = { role };
    updateDoc(userDocRef, newRole)
        .then(() => {
            toast({
                title: 'Rol de usuario actualizado',
                description: `El rol del usuario ha sido actualizado a ${roleNames[role]}.`,
            });
        })
        .catch(async(serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: newRole,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
};
  
  const getBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'super-admin':
        return 'default';
      case 'admin':
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
          case 'admin': return <Briefcase className="mr-2 h-4 w-4" />;
          case 'db-manager': return <Database className="mr-2 h-4 w-4" />;
          case 'db-analyst': return <User className="mr-2 h-4 w-4" />;
          case 'pending-approval': return <CheckCircle className="mr-2 h-4 w-4 text-amber-500" />;
          default: return null;
      }
  }

  const getRoleName = (role: UserRole) => {
    if (role === 'pending-approval') return 'Pendiente';
    return roleNames[role as Exclude<UserRole, 'pending-approval'>] || 'Desconocido';
  }

  const filteredUsers = (role: UserProfile['role'] | 'all') => {
      if (role === 'all') return users.filter(u => u.role !== 'pending-approval');
      return users.filter(user => user.role === role);
  }

  const renderUserTable = (userList: UserProfile[], type: 'pending' | 'managed') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Rol</TableHead>
          {type === 'pending' && <TableHead>Rol Solicitado</TableHead>}
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={type === 'pending' ? 5 : 4} className="h-24 text-center">
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
                    {getRoleName(user.role)}
                </Badge>
              </TableCell>
              {type === 'pending' && (
                <TableCell>
                  <Badge variant="outline">{getRoleName(user.requestedRole || 'db-analyst')}</Badge>
                </TableCell>
              )}
              <TableCell className="text-right space-x-2">
                {type === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-600"
                      onClick={() => handleApprove(user.id, user.requestedRole)}
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
                 {type === 'managed' && user.role !== 'super-admin' && (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {Object.entries(roleNames).map(([roleKey, roleName]) => (
                                    user.role !== roleKey && (
                                        <DropdownMenuItem key={roleKey} onClick={() => handleRoleChange(user.id, roleKey as Exclude<UserRole, 'pending-approval'>)}>
                                            {getIconForRole(roleKey as UserRole)}
                                            <span>{roleName}</span>
                                        </DropdownMenuItem>
                                    )
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">Eliminar</DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción eliminará permanentemente al usuario <strong>{user.email}</strong>. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeny(user.id, user.email)}>Eliminar Usuario</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                 )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={type === 'pending' ? 5 : 4} className="h-24 text-center">
              No hay usuarios en esta categoría.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Apruebe, deniegue o cambie los roles de los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
                    <TabsTrigger value="pending">Pendientes ({filteredUsers('pending-approval').length})</TabsTrigger>
                    <TabsTrigger value="users">Usuarios Activos ({filteredUsers('all').length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    {renderUserTable(filteredUsers('pending-approval'), 'pending')}
                </TabsContent>
                <TabsContent value="users">
                    {renderUserTable(filteredUsers('all'), 'managed')}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
