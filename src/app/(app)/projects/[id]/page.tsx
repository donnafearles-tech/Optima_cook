'use client';
import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import ProjectClientPage from '@/components/projects/project-client-page';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import ImportRecipeDialog from '@/components/projects/import-recipe-dialog';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ProjectPage() {
  const { firestore, user } = useFirebase();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [isImporting, setIsImporting] = useState(false);

  const projectRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'users', user.uid, 'projects', id);
  }, [firestore, user, id]);

  const { data: project, isLoading } = useDoc<Project>(projectRef);

  if (isLoading) {
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

  // After the initial load, if the project is still not found, then it's a true 404.
  if (!project) {
    notFound();
  }

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setIsImporting(true)}>
              <FileUp className="mr-2 h-4 w-4" /> Import Recipe
            </Button>
          </div>
        </div>

        <ProjectClientPage project={project} />
      </div>
      <ImportRecipeDialog
        open={isImporting}
        onOpenChange={setIsImporting}
        project={project}
      />
    </>
  );
}
