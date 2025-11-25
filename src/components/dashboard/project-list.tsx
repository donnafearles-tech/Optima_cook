'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import type { Project } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useFirebase, uploadFileAndGetURL, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const projectImages = PlaceHolderImages.filter(p => p.id.startsWith('project-'));

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectList({ projects, isLoading, onNewProject, onEditProject, onDeleteProject }: ProjectListProps) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, firestore, storage } = useFirebase();
  const { toast } = useToast();

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
  }

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (fileInputRef.current) {
        // Asignamos el projectId al data-attribute antes de abrir el selector
        fileInputRef.current.setAttribute('data-project-id', e.currentTarget.id);
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const projectId = e.currentTarget.getAttribute('data-project-id');

    if (!file || !projectId || !user) {
        return;
    }

    setUploadingImageId(projectId);

    try {
        const filePath = `users/${user.uid}/projects/${projectId}/${file.name}`;
        const downloadURL = await uploadFileAndGetURL(storage, filePath, file);
        
        const projectDocRef = doc(firestore, 'users', user.uid, 'projects', projectId);
        await updateDocumentNonBlocking(projectDocRef, { imageUrl: downloadURL });

        toast({
            title: "Imagen actualizada",
            description: "La nueva imagen del proyecto se ha guardado correctamente.",
        });

    } catch (error) {
        console.error("Error al subir la imagen:", error);
        toast({
            title: "Error al subir la imagen",
            description: "No se pudo guardar la nueva imagen. Inténtalo de nuevo.",
            variant: "destructive",
        });
    } finally {
        setUploadingImageId(null);
         // Limpiamos el valor para que el evento onChange se dispare si se selecciona el mismo archivo de nuevo
        if(e.target) e.target.value = '';
    }
  };
  
  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/png, image/jpeg, image/gif"
        onChange={handleFileChange}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => {
          const fallbackImage = projectImages[index % projectImages.length];
          const imageUrl = project.imageUrl || fallbackImage.imageUrl;

          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader className="flex-row justify-between items-start">
                <div className="flex-1">
                    <div id={project.id} className="aspect-[4/3] relative mb-4 rounded-lg overflow-hidden group cursor-pointer" onClick={handleImageClick}>
                      <Image
                        src={imageUrl}
                        alt={project.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint={fallbackImage.imageHint}
                      />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {uploadingImageId === project.id ? (
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-white" />
                                <span className="text-white text-sm font-semibold mt-1">Cambiar Imagen</span>
                            </>
                        )}
                      </div>
                    </div>
                  <CardTitle className="font-headline">{project.name}</CardTitle>
                  <CardDescription>{project.description || 'Sin descripción.'}</CardDescription>
                </div>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditProject(project)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(project)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground">
                    {isLoading ? 'Cargando tareas...' : `${project.tasks?.length || 0} tareas`}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/projects/${project.id}`}>Abrir Proyecto</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        <Card
          className="flex flex-col items-center justify-center border-dashed hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={onNewProject}
        >
          <div className="text-center p-6">
            <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium font-headline">Nuevo Proyecto</h3>
            <p className="mt-1 text-sm text-muted-foreground">Comienza una nueva aventura culinaria.</p>
          </div>
        </Card>
      </div>
      
       <AlertDialog open={projectToDelete !== null} onOpenChange={(isOpen) => !isOpen && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto "{projectToDelete?.name}" y todos sus datos asociados, incluidas las recetas y tareas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
