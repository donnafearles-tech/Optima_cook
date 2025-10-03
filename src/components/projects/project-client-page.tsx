'use client';
import { useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2, FileUp } from 'lucide-react';
import type { Project, Task, Recipe } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskDependencies } from '@/ai/flows/suggest-task-dependencies';
import { calculateCPM } from '@/lib/cpm';
import TasksTable from './tasks-table';
import EditTaskSheet from './edit-task-sheet';
import { SuggestTaskDependenciesOutput } from '@/lib/types';
import { useFirebase, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

interface ProjectClientPageProps {
  projectId: string;
  userId: string;
  onImportRecipe: () => void;
}

export default function ProjectClientPage({ projectId, userId, onImportRecipe }: ProjectClientPageProps) {
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  // Reference to the project document
  const projectRef = useMemoFirebase(() => {
    return doc(firestore, 'users', userId, 'projects', projectId);
  }, [firestore, userId, projectId]);

  // Fetch the project document
  const { data: project, isLoading: isLoadingProject } = useDoc<Project>(projectRef);

  // Query for the recipes subcollection within the project
  const recipesQuery = useMemoFirebase(() => {
    return collection(projectRef, 'recipes');
  }, [projectRef]);
  const { data: recipes, isLoading: isLoadingRecipes } = useCollection<Recipe>(recipesQuery);

  // Query for the tasks subcollection within the project
  const tasksQuery = useMemoFirebase(() => {
    return collection(projectRef, 'tasks');
  }, [projectRef]);
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);


  const handleTaskSave = (taskToSave: Task) => {
    const tasksCollection = collection(projectRef, 'tasks');

    if (taskToSave.id) {
        const taskDoc = doc(tasksCollection, taskToSave.id);
        const { id, ...dataToSave } = taskToSave;
        updateDocumentNonBlocking(taskDoc, dataToSave);
    } else {
        const { id, ...dataToSave } = taskToSave;
        addDocumentNonBlocking(tasksCollection, dataToSave);
    }
    setEditingTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    const taskDoc = doc(projectRef, 'tasks', taskId);
    deleteDocumentNonBlocking(taskDoc);
    
    toast({
        title: 'Tarea Eliminada',
        description: 'Recuerda revisar las dependencias de otras tareas.',
    });
  };
  
  const handleSuggestDependencies = async () => {
    if (!tasks || tasks.length < 2) {
      toast({
        title: 'No hay suficientes tareas',
        description: 'Necesitas al menos dos tareas para sugerir dependencias.',
        variant: 'destructive'
      });
      return;
    }
    setIsSuggesting(true);
    try {
      const taskList = tasks.map(t => t.name);
      const result: SuggestTaskDependenciesOutput = await suggestTaskDependencies({ recipeName: project?.name || 'Receta', taskList });
      
      const taskNameMap = new Map(tasks.map(t => [t.name, t.id]));
      const batch = writeBatch(firestore);
      const tasksCollection = collection(projectRef, 'tasks');

      tasks.forEach(task => {
        const suggestedPredNames = result[task.name] || [];
        const predecessorIds = suggestedPredNames
          .map(name => taskNameMap.get(name))
          .filter((id): id is string => !!id && id !== task.id);
        
        const taskRef = doc(tasksCollection, task.id);
        batch.update(taskRef, { predecessorIds });
      });

      await batch.commit();

      toast({
        title: '¡Dependencias Sugeridas!',
        description: 'La IA ha sugerido dependencias de tareas. Revisa y ajusta según sea necesario.',
      });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Sugerencia Fallida',
        description: 'No se pudieron obtener sugerencias de la IA. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCalculatePath = () => {
    if (!tasks) return;
    const cpmResult = calculateCPM(tasks);
    updateDocumentNonBlocking(projectRef, { cpmResult });
    router.push(`/projects/${projectId}/guide`);
  };

  if (isLoadingProject || isLoadingRecipes || isLoadingTasks) {
    return <div>Cargando proyecto...</div>;
  }

  if (!project) {
    return notFound();
  }

  const fullProject: Project = {
    ...project,
    id: projectId,
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
            <Button variant="outline" onClick={onImportRecipe}>
              <FileUp className="mr-2 h-4 w-4" /> Importar Receta
            </Button>
          </div>
        </div>
      </div>

      <div className="my-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Tareas</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSuggestDependencies} disabled={isSuggesting || (tasks?.length || 0) < 2}>
              {isSuggesting ? (
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Sugerir Dependencias
            </Button>
            <Button onClick={() => setEditingTask('new')}>Añadir Tarea</Button>
          </div>
        </div>
        <TasksTable 
          tasks={fullProject.tasks}
          onEditTask={(task) => setEditingTask(task)}
          onDeleteTask={handleTaskDelete}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={handleCalculatePath} disabled={fullProject.tasks.length === 0}>
          Calcular Ruta Óptima <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <EditTaskSheet
        open={editingTask !== null}
        onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
        task={editingTask === 'new' ? null : editingTask}
        allTasks={fullProject.tasks}
        recipes={fullProject.recipes}
        onSave={handleTaskSave}
      />
    </>
  );
}
