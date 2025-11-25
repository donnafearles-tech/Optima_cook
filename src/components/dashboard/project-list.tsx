'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
  }

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => {
          const image = projectImages[index % projectImages.length];
          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader className="flex-row justify-between items-start">
                <div className="flex-1">
                  {image && (
                    <div className="aspect-[4/3] relative mb-4">
                      <Image
                        src={image.imageUrl}
                        alt={project.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="rounded-lg object-cover"
                        data-ai-hint={image.imageHint}
                      />
                    </div>
                  )}
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
