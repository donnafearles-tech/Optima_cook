'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Project } from '@/lib/types';
import { useFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export default function CreateProjectDialog({
  open,
  onOpenChange,
  project,
}: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { firestore, user } = useFirebase();

  useEffect(() => {
    if (open) {
      if (project) {
        setName(project.name);
        setDescription(project.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !user) return;

    setIsSaving(true);
    
    const projectsCol = collection(firestore, 'users', user.uid, 'projects');
    
    if (project) {
      // Editing existing project
      const projectDoc = doc(projectsCol, project.id);
      updateDocumentNonBlocking(projectDoc, { name, description });
    } else {
      // Creating new project
      const newProjectData = {
        name,
        description,
        creationDate: serverTimestamp(),
        estimatedTotalDuration: 0,
      };
      addDocumentNonBlocking(projectsCol, newProjectData);
    }
    
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">{project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</DialogTitle>
            <DialogDescription>
             {project ? 'Actualiza los detalles de tu proyecto.' : 'Dale un nombre y una descripción a tu nuevo proyecto de cocina.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving || !name}>
              {isSaving ? 'Guardando...' : (project ? 'Guardar Cambios' : 'Crear Proyecto')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
