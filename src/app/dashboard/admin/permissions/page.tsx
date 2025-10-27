'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Loader2 } from 'lucide-react';

const MODULES = [
  { id: 'queries', name: 'Consultas' },
  { id: 'data-sources', name: 'Fuentes de Datos' },
  { id: 'history', name: 'Historial' },
  { id: 'analytics', name: 'Analíticas' },
  { id: 'admin', name: 'Administración de Usuarios' },
];

const ROLES = [
  { id: 'db-analyst', name: 'Analista de Base de Datos' },
  { id: 'db-manager', name: 'Gestor de Base de Datos' },
  { id: 'admin', name: 'Administrador' },
];

const PERMISSION_TYPES = [
    { id: 'canRead', name: 'Ver' },
    { id: 'canWrite', name: 'Crear/Editar' },
    { id: 'canDelete', name: 'Eliminar' },
];

type Permission = {
  id: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
};

type PermissionsState = Record<string, Record<string, Omit<Permission, 'id'>>>;


export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionsState>({});
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const permissionsColRef = collection(firestore, 'permissions');
    const unsubscribe = onSnapshot(permissionsColRef, (snapshot) => {
      const perms: PermissionsState = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!perms[data.moduleId]) {
          perms[data.moduleId] = {};
        }
        perms[data.moduleId][data.role] = {
          canRead: data.canRead,
          canWrite: data.canWrite,
          canDelete: data.canDelete,
        };
      });
      setPermissions(perms);
      setLoading(false);
    }, (error) => {
      const permissionError = new FirestorePermissionError({
        path: 'permissions',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handlePermissionChange = async (
    moduleId: string,
    roleId: string,
    permissionType: 'canRead' | 'canWrite' | 'canDelete',
    value: boolean
  ) => {
    if (!firestore) return;
    
    // Optimistic update
    setPermissions(prev => {
        const newPermissions = JSON.parse(JSON.stringify(prev));
        if (!newPermissions[moduleId]) newPermissions[moduleId] = {};
        if (!newPermissions[moduleId][roleId]) {
          newPermissions[moduleId][roleId] = { canRead: false, canWrite: false, canDelete: false };
        }
        newPermissions[moduleId][roleId][permissionType] = value;
        return newPermissions;
    });

    const docId = `${moduleId}_${roleId}`;
    const permissionDocRef = doc(firestore, 'permissions', docId);

    const baseData = permissions[moduleId]?.[roleId] || { canRead: false, canWrite: false, canDelete: false };
    
    const dataToSet = {
      moduleId,
      role: roleId,
      ...baseData,
      [permissionType]: value
    };
    
    setDoc(permissionDocRef, dataToSet, { merge: true }).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
            path: permissionDocRef.path,
            operation: 'update',
            requestResourceData: { [permissionType]: value },
        });
        errorEmitter.emit('permission-error', permissionError);
        // Revert optimistic update on error
        setPermissions(prev => {
            const revertedPermissions = JSON.parse(JSON.stringify(prev));
            revertedPermissions[moduleId][roleId][permissionType] = !value;
            return revertedPermissions;
        });
        toast({
            variant: 'destructive',
            title: 'Error de Permiso',
            description: 'No tienes permiso para actualizar este rol.',
        });
    });
  };

  if (loading) {
    return (
        <div className="flex h-[calc(100vh-theme(spacing.48))] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className='space-y-6'>
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Permisos</CardTitle>
                <CardDescription>
                Activa o desactiva el acceso de cada rol a los diferentes módulos del sistema.
                </CardDescription>
            </CardHeader>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {MODULES.map(module => (
        <Card key={module.id}>
          <CardHeader>
            <CardTitle>{module.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Rol</TableHead>
                  {PERMISSION_TYPES.map(pt => (
                      <TableHead key={pt.id} className="text-center">{pt.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLES.map(role => {
                  const currentPerms = permissions[module.id]?.[role.id] || { canRead: false, canWrite: false, canDelete: false };
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      {PERMISSION_TYPES.map(pt => (
                        <TableCell key={pt.id} className="text-center">
                            <Switch
                                id={`${pt.id}-${module.id}-${role.id}`}
                                checked={currentPerms[pt.id as keyof typeof currentPerms]}
                                onCheckedChange={(value) => handlePermissionChange(module.id, role.id, pt.id as 'canRead' | 'canWrite' | 'canDelete', value)}
                            />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
    </div>
  );
}
