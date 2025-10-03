'use client';
import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getProject } from '@/lib/data';
import { FileUp } from 'lucide-react';
import ProjectClientPage from '@/components/projects/project-client-page';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = params;

  useEffect(() => {
    const projectData = getProject(id);
    if (projectData) {
      setProject(projectData);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" /> Import Recipe
          </Button>
        </div>
      </div>

      <ProjectClientPage project={project} />
    </div>
  );
}
