'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2, FileUp, Plus } from 'lucide-react';
import type { Project, Task, Recipe, UserResource } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskDependencies } from '@/ai/flows/suggest-task-dependencies';
import { calculateCPM } from '@/lib/cpm';
import EditTaskSheet from './edit-task-sheet';
import EditRecipeDialog from './edit-recipe-dialog';
import RecipeCard from './recipe-card';
import { useFirebase, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

interface ProjectClientPageProps {
  projectId: string;
  userId: string;
  onImportRecipe: () => void;
}

export default function ProjectClientPage({ projectId, userId, onImportRecipe }: ProjectClientPageProps) {
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | 'new'>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const userRef = useMemoFirebase(() => doc(firestore, 'users', userId), [firestore, userId]);
  const projectRef = useMemoFirebase(() => doc(userRef, 'projects', projectId), [userRef, projectId]);

  const { data: project, isLoading: isLoadingProject, error: projectError } = useDoc<Project>(projectRef);
  
  const recipesQuery = useMemoFirebase(() => collection(projectRef, 'recipes'), [projectRef]);
  const { data: recipes, isLoading: isLoadingRecipes } = useCollection<Recipe>(recipesQuery);

  const tasksQuery = useMemoFirebase(() => collection(projectRef, 'tasks'), [projectRef]);
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
  
  const resourcesQuery = useMemoFirebase(() => collection(userRef, 'resources'), [userRef]);
  const { data: resources, isLoading: isLoadingResources } = useCollection<UserResource>(resourcesQuery);


  const handleOpenEditTask = (task: Task | 'new', recipeId: string) => {
    setEditingTask(task);
  };
  
  const handleRecipeSave = (recipeToSave: Pick<Recipe, 'id' | 'name'>) => {
    const recipesCollection = collection(projectRef, 'recipes');
    if (recipeToSave.id) {
        const recipeDoc = doc(recipesCollection, recipeToSave.id);
        updateDocumentNonBlocking(recipeDoc, { name: recipeToSave.name });
        toast({ title: 'Receta Actualizada', description: `Se ha cambiado el nombre a "${recipeToSave.name}".` });
    } else {
        addDocumentNonBlocking(recipesCollection, { name: recipeToSave.name });
        toast({ title: 'Receta Creada', description: `Se ha añadido la receta "${recipeToSave.name}".` });
    }
    setEditingRecipe(null);
  };

  const handleRecipeDelete = async (recipeId: string) => {
    if (!tasks) return;
    const batch = writeBatch(firestore);
    
    const recipeRef = doc(projectRef, 'recipes', recipeId);
    batch.delete(recipeRef);

    const tasksToDelete = tasks.filter(t => t.recipeId === recipeId);
    tasksToDelete.forEach(t => {
        const taskRef = doc(projectRef, 'tasks', t.id);
        batch.delete(taskRef);
    });

    try {
        await batch.commit();
        toast({ title: 'Receta Eliminada', description: 'La receta y todas sus tareas han sido eliminadas.' });
    } catch (e) {
        console.error("Error al eliminar la receta y sus tareas:", e);
        toast({ title: 'Error', description: 'No se pudo eliminar la receta.', variant: 'destructive' });
    }
  };

  const handleTaskSave = (taskToSave: Task) => {
    const tasksCollection = collection(projectRef, 'tasks');
    const { id, ...dataToSave } = taskToSave;

    if (id) {
        const taskDoc = doc(tasksCollection, id);
        updateDocumentNonBlocking(taskDoc, dataToSave);
    } else {
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
      const result = await suggestTaskDependencies({ recipeName: project?.name || 'Receta', taskList });
      
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

  if (isLoadingProject || isLoadingRecipes || isLoadingTasks || isLoadingResources) {
    return <div>Cargando proyecto...</div>;
  }
  
  if (projectError) {
      return <div>Error al cargar el proyecto. Es posible que no exista o que no tengas permisos para verlo.</div>
  }

  if (!project) {
    return <div>Proyecto no encontrado.</div>;
  }

  const allTasks = tasks || [];
  const allRecipes = recipes || [];
  const allResources = resources || [];

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
          <h2 className="text-2xl font-bold tracking-tight font-headline text-center flex-1">Recetas</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSuggestDependencies} disabled={isSuggesting || (tasks?.length || 0) < 2}>
              {isSuggesting ? (
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Sugerir Dependencias (Global)
            </Button>
            <Button onClick={() => setEditingRecipe('new')}>
                <Plus className="mr-2 h-4 w-4" /> Añadir Receta
            </Button>
          </div>
        </div>
        <div className="space-y-6">
            {allRecipes.map(recipe => (
                <RecipeCard 
                    key={recipe.id}
                    recipe={recipe}
                    tasks={allTasks.filter(t => t.recipeId === recipe.id)}
                    allTasks={allTasks}
                    allResources={allResources}
                    onEditRecipe={() => setEditingRecipe(recipe)}
                    onDeleteRecipe={() => handleRecipeDelete(recipe.id)}
                    onAddTask={() => handleOpenEditTask('new', recipe.id)}
                    onEditTask={(task) => handleOpenEditTask(task, recipe.id)}
                    onDeleteTask={handleTaskDelete}
                />
            ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={handleCalculatePath} disabled={allTasks.length === 0}>
          Calcular Ruta Óptima <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <EditTaskSheet
        open={editingTask !== null}
        onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
        task={editingTask === 'new' ? null : editingTask}
        allTasks={allTasks}
        allRecipes={allRecipes}
        allResources={allResources}
        onSave={handleTaskSave}
      />
      
      <EditRecipeDialog
          open={editingRecipe !== null}
          onOpenChange={(isOpen) => !isOpen && setEditingRecipe(null)}
          recipe={editingRecipe === 'new' ? null : editingRecipe}
          onSave={handleRecipeSave}
      />
    </>
  );
}
