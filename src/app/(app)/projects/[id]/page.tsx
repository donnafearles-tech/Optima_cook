'use client';
import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import ProjectClientPage from '@/components/projects/project-client-page';
import type { Project, Recipe, Task } from '@/lib/types';
import ImportRecipeDialog from '@/components/projects/import-recipe-dialog';
import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';

export default function ProjectPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [isImporting, setIsImporting] = useState(false);
  const { firestore, user } = useFirebase();

  // Reference to the project document
  const projectRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, 'users', user.uid, 'projects', id);
  }, [firestore, user, id]);

  // Fetch the project document
  const { data: project, isLoading: isLoadingProject } = useDoc<Project>(projectRef);

  // Query for the recipes subcollection within the project
  const recipesQuery = useMemoFirebase(() => {
    if (!projectRef) return null;
    return collection(projectRef, 'recipes');
  }, [projectRef]);
  const { data: recipes, isLoading: isLoadingRecipes } = useCollection<Recipe>(recipesQuery);

  // Query for the tasks subcollection within the project
  const tasksQuery = useMemoFirebase(() => {
    if (!projectRef) return null;
    return collection(projectRef, 'tasks');
  }, [projectRef]);
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);


  if (isLoadingProject || isLoadingRecipes || isLoadingTasks || !user) {
    return <div>Cargando proyecto...</div>;
  }

  if (!project) {
    return notFound();
  }
  
  // Combine project data with its recipes and tasks
  const fullProject: Project = {
    ...project,
    recipes: recipes || [],
    tasks: tasks || [],
  };


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
              <FileUp className="mr-2 h-4 w-4" /> Importar Receta
            </Button>
          </div>
        </div>

        <ProjectClientPage project={fullProject} />
      </div>
      <ImportRecipeDialog
        open={isImporting}
        onOpenChange={setIsImporting}
        project={fullProject}
      />
    </>
  );
}
