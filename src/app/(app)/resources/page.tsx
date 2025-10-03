'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import type { UserResource } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import ResourceFormSheet from '@/components/resources/resource-form-sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function ResourcesPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [editingResource, setEditingResource] = useState<UserResource | 'new' | null>(null);

  const resourcesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'resources');
  }, [firestore, user]);

  const { data: resources, isLoading } = useCollection<UserResource>(resourcesQuery);

  const handleSaveResource = (resourceData: Omit<UserResource, 'id'>) => {
    if (!user) return;
    const resourcesCollection = collection(firestore, 'users', user.uid, 'resources');
    
    if (editingResource !== 'new' && editingResource?.id) {
        const resourceDoc = doc(resourcesCollection, editingResource.id);
        updateDocumentNonBlocking(resourceDoc, resourceData);
    } else {
        addDocumentNonBlocking(resourcesCollection, resourceData);
    }
    setEditingResource(null);
  };
  
  const handleDeleteResource = (resourceId: string) => {
    if (!user) return;
    const resourceDoc = doc(firestore, 'users', user.uid, 'resources', resourceId);
    deleteDocumentNonBlocking(resourceDoc);
  };


  if (isLoading || isUserLoading) {
    return <div>Cargando recursos...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Mis Recursos de Cocina
        </h1>
        <Button onClick={() => setEditingResource('new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Recurso
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Inventario</CardTitle>
            <CardDescription>Aquí puedes gestionar los utensilios y electrodomésticos que tienes en tu cocina.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Palabras Clave</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {resources && resources.length > 0 ? (
                    resources.map((resource) => (
                    <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.name}</TableCell>
                        <TableCell>{resource.quantity}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {resource.keywords.map((kw, index) => <Badge key={`${kw}-${index}`} variant="secondary">{kw}</Badge>)}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingResource(resource)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeleteResource(resource.id)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            Aún no has añadido ningún recurso.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>


      <ResourceFormSheet
        open={editingResource !== null}
        onOpenChange={(isOpen) => !isOpen && setEditingResource(null)}
        resource={editingResource === 'new' ? null : editingResource}
        onSave={handleSaveResource}
      />
    </div>
  );
}
