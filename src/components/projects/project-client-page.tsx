'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2, FileUp, Plus, Combine, AlertTriangle, Trash2 } from 'lucide-react';
import type { Project, Task, Recipe, UserResource, CpmResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskDependencies } from '@/ai/flows/suggest-task-dependencies';
import { consolidateTasks } from '@/ai/flows/consolidate-tasks';
import { calculateCPM } from '@/lib/cpm';
import EditTaskSheet from './edit-task-sheet';
import EditRecipeDialog from './edit-recipe-dialog';
import RecipeCard from './recipe-card';
import { useFirebase, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { notFound, useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  const [isClearing, setIsClearing] = useState(false);
  const [isGuideStale, setIsGuideStale] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userRef = useMemoFirebase(() => doc(firestore, 'users', userId), [firestore, userId]);
  const projectRef = useMemoFirebase(() => doc(userRef, 'projects', projectId), [userRef, projectId]);

  const { data: project, isLoading: isLoadingProject, error: projectError } = useDoc<Project>(projectRef);
  
  const recipesQuery = useMemoFirebase(() => collection(projectRef, 'recipes'), [projectRef]);
  const { data: allRecipes, isLoading: isLoadingRecipes } = useCollection<Recipe>(recipesQuery);

  const tasksQuery = useMemoFirebase(() => collection(projectRef, 'tasks'), [projectRef]);
  const { data: allTasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
  
  const resourcesQuery = useMemoFirebase(() => collection(userRef, 'resources'), [userRef]);
  const { data: allResources, isLoading: isLoadingResources } = useCollection<UserResource>(resourcesQuery);

  const handleOpenEditTask = (task: Task | 'new') => {
    if (task === 'new') {
        const defaultRecipeId = (allRecipes || [])[0]?.id || null;
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
    if (project?.cpmResult) {
      updateDocumentNonBlocking(projectRef, { cpmResult: null });
      setIsGuideStale(true);
    }
    if (recipeToSave.id) {
        updateDocumentNonBlocking(doc(recipesCollection, recipeToSave.id), { name: recipeToSave.name });
        toast({ title: 'Receta Actualizada', description: `Se ha cambiado el nombre a "${recipeToSave.name}".` });
    } else {
        addDocumentNonBlocking(recipesCollection, { name: recipeToSave.name });
        toast({ title: 'Receta Creada', description: `Se ha añadido la receta "${recipeToSave.name}".` });
    }
    setEditingRecipe(null);
  };

  const handleRecipeDelete = (recipeId: string) => {
    if (!project || !allTasks) return;
  
    const batch = writeBatch(firestore);
    const recipeRefDoc = doc(projectRef, 'recipes', recipeId);
    batch.delete(recipeRefDoc);
  
    const tasksToDelete = allTasks.filter(t => (t.recipeIds || []).includes(recipeId));
    tasksToDelete.forEach(t => {
      const taskRef = doc(projectRef, 'tasks', t.id);
      batch.delete(taskRef);
    });
  
    if (project.cpmResult) {
      batch.update(projectRef, { cpmResult: null });
    }
  
    batch.commit().then(() => {
      setIsGuideStale(true);
      toast({ title: 'Receta Eliminada', description: 'La receta y sus tareas han sido eliminadas. La guía necesita recalcularse.' });
    }).catch((e) => {
      console.error("Error al eliminar la receta y sus tareas:", e);
      toast({ title: 'Error', description: 'No se pudo eliminar la receta.', variant: 'destructive' });
    });
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
    
    if (project?.cpmResult) {
      updateDocumentNonBlocking(projectRef, { cpmResult: null });
      setIsGuideStale(true);
    }

    if (id) {
        updateDocumentNonBlocking(doc(tasksCollection, id), dataToSave);
    } else {
        addDocumentNonBlocking(tasksCollection, dataToSave);
    }

    setEditingTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    const taskDoc = doc(projectRef, 'tasks', taskId);
    deleteDocumentNonBlocking(taskDoc);

    if (project?.cpmResult) {
      updateDocumentNonBlocking(projectRef, { cpmResult: null });
    }
    setIsGuideStale(true);

    toast({
        title: 'Tarea Eliminada',
        description: 'Recuerda recalcular la guía para ver los cambios.',
    });
  };
  
  const handleSuggestDependencies = async () => {
    const currentTasks = allTasks || [];
    if (currentTasks.length < 2) {
      toast({
        title: 'No hay suficientes tareas',
        description: 'Necesitas al menos dos tareas para sugerir dependencias.',
        variant: 'destructive'
      });
      return;
    }
    setIsSuggesting(true);
    try {
      const taskList = currentTasks.map(t => t.name);
      const result = await suggestTaskDependencies({ recipeName: project?.name || 'Receta', taskList });
      
      const taskNameMap = new Map(currentTasks.map(t => [t.name, t.id]));
      const batch = writeBatch(firestore);
      const tasksCollection = collection(projectRef, 'tasks');
      
      let changed = false;
      result.dependencies.forEach(depPair => {
        const taskId = taskNameMap.get(depPair.taskName);
        if (taskId) {
            const predecessorIds = depPair.predecessorNames
              .map(name => taskNameMap.get(name))
              .filter((id): id is string => !!id && id !== taskId);
            
            const taskRef = doc(tasksCollection, taskId);
            batch.update(taskRef, { predecessorIds });
            changed = true;
        }
      });

      if (project?.cpmResult) {
        batch.update(projectRef, { cpmResult: null });
      }

      await batch.commit();

      if (changed) {
        setIsGuideStale(true);
      }

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
    const currentTasks = allTasks || [];
    const currentRecipes = allRecipes || [];
    if (currentTasks.length < 1 || currentRecipes.length < 1) {
        toast({ title: 'No hay suficientes datos', description: 'Necesitas tareas y recetas para consolidar.', variant: 'destructive' });
        return;
    }
    setIsConsolidating(true);
    try {
        const originalTasksMap = new Map(currentTasks.map(t => [t.id, t]));
        const aiResult = await consolidateTasks({
            tasks: currentTasks.map(t => ({ id: t.id, name: t.name, duration: t.duration, recipeIds: t.recipeIds || [], predecessorIds: t.predecessorIds })),
            recipes: currentRecipes.map(r => ({ id: r.id, name: r.name })),
        });

        const batch = writeBatch(firestore);
        const tasksCol = collection(projectRef, 'tasks');
        
        const tasksToDeleteIds = new Set<string>();
        aiResult.consolidatedTasks.forEach(group => {
            group.originalTaskIds.forEach(id => tasksToDeleteIds.add(id));
        });

        if(tasksToDeleteIds.size === 0 && aiResult.unconsolidatedTaskIds.length === currentTasks.length) {
            toast({ title: 'Sin cambios', description: 'No se encontraron tareas para consolidar.' });
            setIsConsolidating(false);
            return;
        }

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

        if (project?.cpmResult) {
          batch.update(projectRef, { cpmResult: null });
        }

        await batch.commit();

        setIsGuideStale(true);

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

  const handleCalculatePath = async () => {
    const currentTasks = allTasks || [];
    if (!project || currentTasks.length === 0) return;
    setIsCalculatingPath(true);
  
    try {
      await updateDocumentNonBlocking(projectRef, { cpmResult: null });
  
      router.push(`/projects/${projectId}/guide`);
  
      // Calculation happens in the background. The guide page will show loading.
      const runCalculation = async () => {
        const cpmResult = calculateCPM(currentTasks);
        await updateDocumentNonBlocking(projectRef, { cpmResult });
        setIsGuideStale(false);
      };
  
      runCalculation();
  
    } catch(error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Revisa la consola para más detalles.";
      toast({
          title: "Error al Iniciar Cálculo",
          description: errorMessage,
          variant: "destructive",
      });
      setIsCalculatingPath(false);
    }
    // No finally block here, as we navigate away. The state will reset on component unmount.
  };

  const handleClearProject = async () => {
    setIsClearing(true);
    try {
      const batch = writeBatch(firestore);
  
      // Delete all tasks
      const tasksSnapshot = await getDocs(tasksQuery!);
      tasksSnapshot.forEach(doc => batch.delete(doc.ref));
  
      // Delete all recipes
      const recipesSnapshot = await getDocs(recipesQuery!);
      recipesSnapshot.forEach(doc => batch.delete(doc.ref));
  
      // Clear the CPM result on the project
      batch.update(projectRef, { cpmResult: null });
  
      await batch.commit();
  
      toast({
        title: "Proyecto Limpiado",
        description: "Todas las recetas y tareas han sido eliminadas.",
      });
      setIsGuideStale(false);
  
    } catch (error) {
      console.error("Error al limpiar el proyecto:", error);
      toast({
        title: "Error de Limpieza",
        description: "No se pudo limpiar el proyecto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };
  
  useEffect(() => {
    const currentTasks = allTasks || [];
    if (project && !project.cpmResult && currentTasks.length > 0) {
        if (!isGuideStale) setIsGuideStale(true);
    }
    else if (project && project.cpmResult && project.cpmResult.tasks.length !== currentTasks.length) {
        if (!isGuideStale) setIsGuideStale(true);
    } else if (project?.cpmResult && !isGuideStale) {
        // Additional check: verify if the tasks in cpmResult match the current tasks
        const cpmTaskIds = new Set(project.cpmResult.tasks.map(t => t.id));
        const currentTaskIds = new Set(currentTasks.map(t => t.id));
        if (cpmTaskIds.size !== currentTaskIds.size || !([...cpmTaskIds].every(id => currentTaskIds.has(id)))) {
           if (!isGuideStale) setIsGuideStale(true);
        }
    }
  }, [project, allTasks, isGuideStale]);

  const isLoading = isLoadingProject || isLoadingRecipes || isLoadingTasks || isLoadingResources;

  if (isLoading) {
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
  
  const hasValidGuide = project.cpmResult && !isGuideStale;

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
              <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Borrar Proyecto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro de que quieres borrar todo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción es irreversible. Se eliminarán todas las recetas y tareas asociadas a este proyecto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearProject} disabled={isClearing}>
                    {isClearing ? 'Borrando...' : 'Sí, borrar todo'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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
             <Button variant="outline" onClick={handleConsolidateTasks} disabled={isConsolidating || (allTasks || []).length < 2}>
              {isConsolidating ? (
                <Combine className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Combine className="mr-2 h-4 w-4" />
              )}
              Unificar Tareas
            </Button>
            <Button variant="outline" onClick={handleSuggestDependencies} disabled={isSuggesting || (allTasks || []).length < 2}>
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
            {(allRecipes || []).map(recipe => (
                <RecipeCard 
                    key={recipe.id}
                    recipe={recipe}
                    tasks={(allTasks || []).filter(t => (t.recipeIds || []).includes(recipe.id))}
                    allTasks={allTasks || []}
                    allRecipes={allRecipes || []}
                    allResources={allResources || []}
                    onEditRecipe={() => setEditingRecipe(recipe)}
                    onDeleteRecipe={() => handleRecipeDelete(recipe.id)}
                    onAddTask={() => handleOpenEditTask('new')}
                    onEditTask={(task) => handleOpenEditTask(task)}
                    onDeleteTask={handleTaskDelete}
                />
            ))}
             {(allRecipes || []).length === 0 && (
              <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <h3 className="text-lg font-semibold">Este proyecto está vacío</h3>
                <p className="mt-1">Comienza por importar o añadir una receta.</p>
              </div>
            )}
        </div>
      </div>

       <div className="mt-8 flex justify-end gap-2">
         {isGuideStale ? (
            <Button size="lg" variant="destructive" onClick={handleCalculatePath} disabled={isCalculatingPath}>
              {isCalculatingPath ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Recalcular Guía
            </Button>
         ) : hasValidGuide ? (
            <Button size="lg" onClick={() => router.push(`/projects/${projectId}/guide`)}>
              Ver Guía <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
         ) : (
            <Button size="lg" onClick={handleCalculatePath} disabled={(allTasks || []).length === 0 || isCalculatingPath}>
              {isCalculatingPath ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Calcular Ruta Óptima
            </Button>
         )}
      </div>

      <EditTaskSheet
        open={editingTask !== null}
        onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
        task={editingTask === 'new' ? null : editingTask as Task | null}
        allTasks={allTasks || []}
        allRecipes={allRecipes || []}
        allResources={allResources || []}
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
