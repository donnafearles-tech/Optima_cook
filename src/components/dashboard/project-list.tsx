'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import type { Project } from '@/lib/types';
import CreateProjectDialog from './create-project-dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const projectImages = PlaceHolderImages.filter(p => p.id.startsWith('project-'));

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => {
          const image = projectImages[index % projectImages.length];
          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                {image && (
                  <div className="aspect-[4/3] relative mb-4">
                    <Image
                      src={image.imageUrl}
                      alt={project.name}
                      fill
                      className="rounded-lg object-cover"
                      data-ai-hint={image.imageHint}
                    />
                  </div>
                )}
                <CardTitle className="font-headline">{project.name}</CardTitle>
                <CardDescription>{project.description || 'Sin descripción.'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* This count might not be immediately accurate with Firestore subcollections without extra queries */}
                <p className="text-sm text-muted-foreground">{project.tasks?.length || 0} tareas</p>
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
          onClick={() => setCreateDialogOpen(true)}
        >
          <div className="text-center p-6">
            <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium font-headline">Nuevo Proyecto</h3>
            <p className="mt-1 text-sm text-muted-foreground">Comienza una nueva aventura culinaria.</p>
          </div>
        </Card>
      </div>
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
