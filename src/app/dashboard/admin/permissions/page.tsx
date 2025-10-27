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
    
    const newPermissions = { ...permissions };
    if (!newPermissions[moduleId]) newPermissions[moduleId] = {};
    if (!newPermissions[moduleId][roleId]) {
      newPermissions[moduleId][roleId] = { canRead: false, canWrite: false, canDelete: false };
    }
    newPermissions[moduleId][roleId][permissionType] = value;
    setPermissions(newPermissions);

    const docId = `${moduleId}_${roleId}`;
    const permissionDocRef = doc(firestore, 'permissions', docId);

    
    const dataToSet = {
      moduleId,
      role: roleId,
      ...newPermissions[moduleId][roleId],
    };
    
    setDoc(permissionDocRef, dataToSet, { merge: true }).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
            path: permissionDocRef.path,
            operation: 'update',
            requestResourceData: { [permissionType]: value },
        });
        errorEmitter.emit('permission-error', permissionError);
        // Revert optimistic update
        const oldPermissions = { ...permissions };
        oldPermissions[moduleId][roleId][permissionType] = !value;
        setPermissions(oldPermissions);
        toast({
            variant: 'destructive',
            title: 'Error de Permiso',
            description: 'No tienes permiso para actualizar este rol.',
        });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Permisos</CardTitle>
        <CardDescription>
          Activa o desactiva el acceso de cada rol a los diferentes módulos del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Módulo</TableHead>
                {ROLES.map(role => (
                  <TableHead key={role.id} className="text-center">{role.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODULES.map(module => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  {ROLES.map(role => {
                    const currentPerms = permissions[module.id]?.[role.id] || { canRead: false, canWrite: false, canDelete: false };
                    return (
                      <TableCell key={role.id} className="text-center">
                        <div className="flex justify-center items-center space-x-4">
                           <div className="flex items-center space-x-2">
                                <Switch
                                    id={`read-${module.id}-${role.id}`}
                                    checked={currentPerms.canRead}
                                    onCheckedChange={(value) => handlePermissionChange(module.id, role.id, 'canRead', value)}
                                />
                                <label htmlFor={`read-${module.id}-${role.id}`} className="text-sm font-medium">Ver</label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch
                                    id={`write-${module.id}-${role.id}`}
                                    checked={currentPerms.canWrite}
                                    onCheckedChange={(value) => handlePermissionChange(module.id, role.id, 'canWrite', value)}
                                />
                                <label htmlFor={`write-${module.id}-${role.id}`} className="text-sm font-medium">Crear/Editar</label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch
                                    id={`delete-${module.id}-${role.id}`}
                                    checked={currentPerms.canDelete}
                                    onCheckedChange={(value) => handlePermissionChange(module.id, role.id, 'canDelete', value)}
                                />
                                <label htmlFor={`delete-${module.id}-${role.id}`} className="text-sm font-medium">Eliminar</label>
                            </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
