'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2, FileUp, Plus, Combine, AlertTriangle } from 'lucide-react';
import type { Project, Task, Recipe, UserResource, CpmResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskDependencies } from '@/ai/flows/suggest-task-dependencies';
import { consolidateTasks } from '@/ai/flows/consolidate-tasks';
import { calculateCPM } from '@/lib/cpm';
import EditTaskSheet from './edit-task-sheet';
import EditRecipeDialog from './edit-recipe-dialog';
import RecipeCard from './recipe-card';
import { useFirebase, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { notFound, useRouter } from 'next/navigation';

interface ProjectClientPageProps {
  projectId: string;
  userId: string;
  onImportRecipe: () => void;
}

export default function ProjectClientPage({ projectId, userId, onImportRecipe }: ProjectClientPageProps) {
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | 'new'>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isCalculatingPath, setIsCalculatingPath] = useState(false);
  const [isGuideStale, setIsGuideStale] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userRef = useMemoFirebase(() => doc(firestore, 'users', userId), [firestore, userId]);
  const projectRef = useMemoFirebase(() => doc(userRef, 'projects', projectId), [userRef, projectId]);

  const { data: project, isLoading: isLoadingProject, error: projectError, setData: setProject } = useDoc<Project>(projectRef);
  
  const recipesQuery = useMemoFirebase(() => collection(projectRef, 'recipes'), [projectRef]);
  const { data: recipes, isLoading: isLoadingRecipes } = useCollection<Recipe>(recipesQuery);

  const tasksQuery = useMemoFirebase(() => collection(projectRef, 'tasks'), [projectRef]);
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
  
  const resourcesQuery = useMemoFirebase(() => collection(userRef, 'resources'), [userRef]);
  const { data: resources, isLoading: isLoadingResources } = useCollection<UserResource>(resourcesQuery);
  
  const invalidateGuide = () => {
    if (project?.cpmResult) {
      // Update local state immediately for instant UI feedback
      setProject(prev => (prev ? { ...prev, cpmResult: undefined } : null));
      setIsGuideStale(true);

      // Then, update Firestore non-blockingly to persist the invalidation
      updateDocumentNonBlocking(projectRef, { cpmResult: null });
    }
  };


  const handleOpenEditTask = (task: Task | 'new') => {
    if (task === 'new') {
        const defaultRecipeId = recipes?.[0]?.id || null;
        if (!defaultRecipeId) {
            toast({
                title: "No hay recetas",
                description: "Crea una receta antes de añadir una tarea.",
                variant: "destructive",
            });
            return;
        }
        const newTaskTemplate: Task = {
            id: '',
            name: '',
            duration: 300,
            predecessorIds: [],
            resourceIds: [],
            status: 'pending',
            recipeIds: [defaultRecipeId],
        };
        setEditingTask(newTaskTemplate);
    } else {
        setEditingTask(task);
    }
  };
  
  const handleRecipeSave = (recipeToSave: Pick<Recipe, 'id' | 'name'>) => {
    const recipesCollection = collection(projectRef, 'recipes');
    invalidateGuide();
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
    if (!tasks || !project) return;
    
    // Invalidate UI immediately
    invalidateGuide();

    try {
      const batch = writeBatch(firestore);

      // 1. Mark the recipe document for deletion
      const recipeRef = doc(projectRef, 'recipes', recipeId);
      batch.delete(recipeRef);

      // 2. Find all tasks associated with this recipe and mark them for deletion
      const tasksToDelete = tasks.filter(t => (t.recipeIds || []).includes(recipeId));
      tasksToDelete.forEach(t => {
          const taskRef = doc(projectRef, 'tasks', t.id);
          batch.delete(taskRef);
      });
      
      // 3. Mark the CPM result as null to ensure guide is invalidated on the backend
      batch.update(projectRef, { cpmResult: null });

      // 4. Commit all operations atomically
      await batch.commit();

      toast({ title: 'Receta Eliminada', description: 'La receta y sus tareas han sido eliminadas. La guía necesita recalcularse.' });
    
    } catch (e) {
        console.error("Error al eliminar la receta y sus tareas:", e);
        toast({ title: 'Error', description: 'No se pudo eliminar la receta.', variant: 'destructive' });
        // Optionally, re-fetch data or revert UI state if deletion fails
    }
  };

  const handleTaskSave = (taskToSave: Task) => {
    const tasksCollection = collection(projectRef, 'tasks');
    const { id, ...dataToSave } = taskToSave;

    if (!dataToSave.recipeIds || dataToSave.recipeIds.length === 0) {
        toast({
            title: 'Error al Guardar',
            description: 'Toda tarea debe estar asociada a al menos una receta.',
            variant: 'destructive',
        });
        return;
    }
    
    invalidateGuide();

    if (id) {
        const taskDoc = doc(tasksCollection, id);
        updateDocumentNonBlocking(taskDoc, dataToSave);
    } else {
        addDocumentNonBlocking(tasksCollection, dataToSave);
    }

    setEditingTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    invalidateGuide();
    const taskDoc = doc(projectRef, 'tasks', taskId);
    deleteDocumentNonBlocking(taskDoc);
    toast({
        title: 'Tarea Eliminada',
        description: 'Recuerda recalcular la guía para ver los cambios.',
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
      
      result.dependencies.forEach(depPair => {
        const taskId = taskNameMap.get(depPair.taskName);
        if (taskId) {
            const predecessorIds = depPair.predecessorNames
              .map(name => taskNameMap.get(name))
              .filter((id): id is string => !!id && id !== taskId);
            
            const taskRef = doc(tasksCollection, taskId);
            batch.update(taskRef, { predecessorIds });
        }
      });


      await batch.commit();
      invalidateGuide();

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

  const handleConsolidateTasks = async () => {
    if (!tasks || tasks.length < 1 || !recipes) {
        toast({ title: 'No hay suficientes datos', description: 'Necesitas tareas y recetas para consolidar.', variant: 'destructive' });
        return;
    }
    setIsConsolidating(true);
    try {
        const originalTasksMap = new Map(tasks.map(t => [t.id, t]));
        const aiResult = await consolidateTasks({
            tasks: tasks.map(t => ({ id: t.id, name: t.name, duration: t.duration, recipeIds: t.recipeIds || [], predecessorIds: t.predecessorIds })),
            recipes: recipes.map(r => ({ id: r.id, name: r.name })),
        });

        const batch = writeBatch(firestore);
        const tasksCol = collection(projectRef, 'tasks');
        
        const tasksToDeleteIds = new Set<string>();
        aiResult.consolidatedTasks.forEach(group => {
            group.originalTaskIds.forEach(id => tasksToDeleteIds.add(id));
        });

        tasksToDeleteIds.forEach(id => {
            batch.delete(doc(tasksCol, id));
        });
        
        aiResult.consolidatedTasks.forEach(group => {
            const newDocRef = doc(tasksCol);
            
            const mergedResourceIds = new Set<string>();
            group.originalTaskIds.forEach(originalTaskId => {
                const originalTask = originalTasksMap.get(originalTaskId);
                if (originalTask?.resourceIds) {
                    originalTask.resourceIds.forEach(resId => mergedResourceIds.add(resId));
                }
            });

            const newTaskData = {
                name: group.consolidatedName,
                duration: group.duration,
                recipeIds: group.recipeIds,
                predecessorIds: [], 
                resourceIds: Array.from(mergedResourceIds),
                status: 'pending' as const,
                isAssemblyStep: group.originalTaskIds.some(id => originalTasksMap.get(id)?.isAssemblyStep),
            };
            batch.set(newDocRef, newTaskData);
        });

        await batch.commit();
        invalidateGuide();

        toast({
            title: '¡Tareas Consolidadas!',
            description: `Se han unificado ${tasksToDeleteIds.size} tareas en ${aiResult.consolidatedTasks.length} nuevas tareas optimizadas.`,
        });

    } catch (error) {
        console.error(error);
        toast({ title: 'Falló la Consolidación', description: 'La IA no pudo unificar las tareas.', variant: 'destructive' });
    } finally {
        setIsConsolidating(false);
    }
};

  const handleCalculatePath = () => {
    if (!tasks || !project) return;
    setIsCalculatingPath(true);
    try {
        const cpmResult = calculateCPM(tasks);
        updateDocumentNonBlocking(projectRef, { cpmResult });
        
        setIsGuideStale(false); 

        toast({
          title: "¡Ruta Óptima Calculada!",
          description: "Tu guía de cocina está lista.",
        });
    } catch(error) {
        console.error(error);
        toast({
            title: "Error al Calcular",
            description: "No se pudo calcular la ruta crítica. Revisa la consola para más detalles.",
            variant: "destructive",
        });
    } finally {
        setIsCalculatingPath(false);
    }
  };
  
  useEffect(() => {
    // This effect ensures the stale flag is correctly set when the project data changes from an external source.
    if (project && !project.cpmResult && (tasks?.length ?? 0) > 0) {
        setIsGuideStale(true);
    } else if (project && project.cpmResult) {
        // If we have a result, we assume it's fresh unless an action invalidates it.
        setIsGuideStale(false);
    }
  }, [project, tasks]);

  if (isLoadingProject || isLoadingRecipes || isLoadingTasks || isLoadingResources) {
    return <div>Cargando proyecto...</div>;
  }
  
  if (projectError) {
      return (
        <Alert variant="destructive">
            <AlertTitle>Error al cargar el proyecto</AlertTitle>
            <AlertDescription>
                Ha ocurrido un error al cargar el proyecto. Es posible que no tengas permisos o que haya un problema de red.
            </AlertDescription>
        </Alert>
      );
  }

  if (!project) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Proyecto no encontrado</AlertTitle>
            <AlertDescription>
                El proyecto que buscas no existe. Por favor, vuelve al dashboard.
            </AlertDescription>
        </Alert>
    );
  }

  const allTasks = tasks || [];
  const allRecipes = recipes || [];
  const allResources = resources || [];
  
  const hasGuideData = !!project.cpmResult;

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
          <h2 className="text-2xl font-bold tracking-tight font-headline flex-1">Recetas</h2>
          <div className="flex gap-2">
             <Button variant="outline" onClick={handleConsolidateTasks} disabled={isConsolidating || allTasks.length < 2}>
              {isConsolidating ? (
                <Combine className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Combine className="mr-2 h-4 w-4" />
              )}
              Unificar Tareas
            </Button>
            <Button variant="outline" onClick={handleSuggestDependencies} disabled={isSuggesting || allTasks.length < 2}>
              {isSuggesting ? (
                <Wand2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Sugerir Dependencias
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
                    tasks={allTasks.filter(t => (t.recipeIds || []).includes(recipe.id))}
                    allTasks={allTasks}
                    allRecipes={allRecipes}
                    allResources={allResources}
                    onEditRecipe={() => setEditingRecipe(recipe)}
                    onDeleteRecipe={() => handleRecipeDelete(recipe.id)}
                    onAddTask={() => handleOpenEditTask('new')}
                    onEditTask={(task) => handleOpenEditTask(task)}
                    onDeleteTask={handleTaskDelete}
                />
            ))}
             {allRecipes.length === 0 && (
              <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <h3 className="text-lg font-semibold">Este proyecto está vacío</h3>
                <p className="mt-1">Comienza por importar o añadir una receta.</p>
              </div>
            )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-2">
        {!hasGuideData && (
          <Button 
                size="lg" 
                onClick={handleCalculatePath} 
                disabled={allTasks.length === 0 || isCalculatingPath}
             >
              {isCalculatingPath ? (
                  <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                  </>
              ) : (
                  'Calcular Ruta Óptima'
              )}
          </Button>
        )}
        {hasGuideData && isGuideStale && (
          <Button 
                size="lg" 
                variant="destructive"
                onClick={handleCalculatePath} 
                disabled={allTasks.length === 0 || isCalculatingPath}
             >
              {isCalculatingPath ? (
                  <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Recalculando...
                  </>
              ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Recalcular Guía
                  </>
              )}
          </Button>
        )}
        {hasGuideData && !isGuideStale && (
           <Button size="lg" asChild>
            <Link href={`/projects/${projectId}/guide`}>Ver Guía <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        )}
      </div>

      <EditTaskSheet
        open={editingTask !== null}
        onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
        task={editingTask === 'new' ? null : editingTask as Task | null}
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
