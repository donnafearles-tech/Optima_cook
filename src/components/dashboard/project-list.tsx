'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import type { Project } from '@/lib/types';
import { getProjects } from '@/lib/data';
import CreateProjectDialog from './create-project-dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const projectImages = PlaceHolderImages.filter(p => p.id.startsWith('project-'));

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
  };

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
                <CardDescription>{project.description || 'No description provided.'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{project.tasks.length} tasks</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/projects/${project.id}`}>Open Project</Link>
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
            <h3 className="mt-2 text-lg font-medium font-headline">New Project</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start a new cooking adventure.</p>
          </div>
        </Card>
      </div>
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
