'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2, FileUp, Plus, Combine, AlertTriangle, Trash2, Undo, Download, Copy, Move, Edit, Save, X } from 'lucide-react';
import type { Project, Task, Recipe, UserResource, CpmResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskDependencies } from '@/ai/flows/suggest-task-dependencies';
import { calculateCPM } from '@/lib/cpm';
import EditTaskSheet from './edit-task-sheet';
import EditRecipeDialog from './edit-recipe-dialog';
import RecipeCard from './recipe-card';
import { useFirebase, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, getDocs, addDoc, DocumentReference } from 'firebase/firestore';
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
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface ProjectClientPageProps {
  projectId: string;
  userId: string;
  onImportRecipe: () => void;
}

type HistoryState = {
    tasks: Task[];
    recipes: Recipe[];
    description: string;
}

const normalize = (str: string) => {
    if (!str) return '';
    // Expanded list of stop words based on the provided culinary dictionary
    const stopWords = [
      'la', 'el', 'un', 'una', 'de', 'para', 'los', 'las', 'a', 'con', 'en', 'y', 'o',
      'olla', 'sarten', 'horno', 'bol', 'tabla', 'cuchillo', 'cazuela', 'procesador', 'batidora',
      'primera', 'segunda', 'tercera', 'cuarta',
      'rebanada', 'loncha', 'pieza', 'trozo', 'cucharada', 'cucharadita'
    ];
    const regex = new RegExp(`\\b(${stopWords.join('|')})\\b`, 'g');
    
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,¡!¿]/g, '')
        .replace(regex, '')
        .trim().replace(/\s+/g, ' ');
};

export default function ProjectClientPage({ projectId, userId, onImportRecipe }: ProjectClientPageProps) {
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | 'new'>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSuggestingNatively, setIsSuggestingNatively] = useState(false);
  const [isCalculatingPath, setIsCalculatingPath] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isGuideStale, setIsGuideStale] = useState(false);
  const [showDependencyWarning, setShowDependencyWarning] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');


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
  
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || '');
    }
  }, [project]);
  
  const saveToHistory = (description: string) => {
    const currentSnapshot: HistoryState = {
      tasks: allTasks || [],
      recipes: allRecipes || [],
      description: description
    };
    // Keep only the last state
    setHistory([currentSnapshot]);
  };

  const handleSaveProjectDetails = () => {
    if (!project) return;
    if (projectName.trim() === '') {
      toast({ title: 'El nombre no puede estar vacío', variant: 'destructive' });
      return;
    }
    const detailsToUpdate: Partial<Project> = {};
    if (projectName !== project.name) {
      detailsToUpdate.name = projectName;
    }
    if (projectDescription !== (project.description || '')) {
      detailsToUpdate.description = projectDescription;
    }

    if (Object.keys(detailsToUpdate).length > 0) {
      updateDocumentNonBlocking(projectRef, detailsToUpdate);
      toast({ title: 'Proyecto actualizado' });
    }
    setIsEditingProject(false);
  };
  
  const handleUndo = async () => {
    if (history.length === 0) return;

    setIsUndoing(true);
    const lastState = history[history.length - 1];

    try {
        const batch = writeBatch(firestore);

        // Delete all current tasks and recipes
        const currentTasksSnapshot = await getDocs(tasksQuery!);
        currentTasksSnapshot.forEach(doc => batch.delete(doc.ref));

        const currentRecipesSnapshot = await getDocs(recipesQuery!);
        currentRecipesSnapshot.forEach(doc => batch.delete(doc.ref));

        // Restore tasks and recipes from history
        const taskRefs = new Map(lastState.tasks.map(t => [t.id, doc(projectRef, 'tasks', t.id)]));
        const recipeRefs = new Map(lastState.recipes.map(r => [r.id, doc(projectRef, 'recipes', r.id)]));
        
        lastState.tasks.forEach(task => {
            const { id, ...taskData } = task;
            batch.set(taskRefs.get(id)!, taskData);
        });

        lastState.recipes.forEach(recipe => {
            const { id, ...recipeData } = recipe;
            batch.set(recipeRefs.get(id)!, recipeData);
        });

        // Clear CPM result as it's now invalid
        batch.update(projectRef, { cpmResult: null });

        await batch.commit();

        toast({
            title: "Acción deshecha",
            description: `Se restauró el estado anterior a: "${lastState.description}"`,
        });

        // Clear history after undoing
        setHistory([]);
    } catch (error) {
        console.error("Error al deshacer:", error);
        toast({
            title: "Error al Deshacer",
            description: "No se pudo restaurar el estado anterior.",
            variant: "destructive",
        });
    } finally {
        setIsUndoing(false);
    }
  };


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
  
    saveToHistory('Eliminar receta');
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
      setHistory([]); // Clear history on failure
    });
  };

const handleTaskSave = async (taskToSave: Task) => {
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

  const handleDuplicateRecipe = async (recipeId: string) => {
    if (!allRecipes || !allTasks) return;

    const recipeToDuplicate = allRecipes.find(r => r.id === recipeId);
    if (!recipeToDuplicate) return;

    saveToHistory(`Duplicar la receta "${recipeToDuplicate.name}"`);

    const tasksToDuplicate = allTasks.filter(t => (t.recipeIds || []).includes(recipeId));

    try {
        const batch = writeBatch(firestore);

        // 1. Create the new recipe
        const newRecipeRef = doc(collection(projectRef, 'recipes'));
        batch.set(newRecipeRef, { name: `[Copia] ${recipeToDuplicate.name}` });

        // 2. Create new task documents and build a map from old ID to new ID
        const oldToNewTaskMap = new Map<string, string>();
        const newTasksRefs: { newTaskRef: DocumentReference, originalTask: Task }[] = [];

        tasksToDuplicate.forEach(originalTask => {
            const newTaskRef = doc(collection(projectRef, 'tasks'));
            oldToNewTaskMap.set(originalTask.id, newTaskRef.id);
            newTasksRefs.push({ newTaskRef, originalTask });
        });

        // 3. Set the data for the new tasks, mapping predecessor IDs
        newTasksRefs.forEach(({ newTaskRef, originalTask }) => {
            const { id, predecessorIds, recipeIds, ...restOfTask } = originalTask;

            const newPredecessorIds = (predecessorIds || [])
                .map(oldPredId => oldToNewTaskMap.get(oldPredId))
                .filter((newPredId): newPredId is string => !!newPredId);

            const newTaskData = {
                ...restOfTask,
                recipeIds: [newRecipeRef.id],
                predecessorIds: newPredecessorIds,
            };
            batch.set(newTaskRef, newTaskData);
        });
        
        if (project?.cpmResult) {
            batch.update(projectRef, { cpmResult: null });
        }
        
        await batch.commit();

        toast({
            title: "Receta Duplicada",
            description: `Se ha creado una copia de "${recipeToDuplicate.name}".`,
        });
        setIsGuideStale(true);
    } catch (error) {
        console.error("Error al duplicar la receta:", error);
        toast({
            title: "Error al Duplicar",
            description: "No se pudo duplicar la receta.",
            variant: "destructive",
        });
        setHistory([]); // Clear history on failure
    }
  };

  const handleSuggestDependenciesNatively = async () => {
    const currentTasks = allTasks || [];
    if (currentTasks.length < 2) {
      toast({ title: 'No hay suficientes tareas', variant: 'destructive' });
      return;
    }
    saveToHistory('Sugerir dependencias (Nativo)');
    setIsSuggestingNatively(true);
    try {
      const taskMap = new Map(currentTasks.map(t => [t.id, { ...t, normalizedName: normalize(t.name) }]));
      const batch = writeBatch(firestore);
      const tasksCollection = collection(projectRef, 'tasks');
      let changed = false;

      taskMap.forEach(task => {
        const newPredecessors = new Set(task.predecessorIds);
        const taskWords = task.normalizedName.split(' ');
        const mainAction = taskWords[0];
        const ingredient = taskWords.slice(1).join(' ');

        // Regla 1: Preparación Básica antes de Corte
        if (mainAction === 'picar' || mainAction === 'cortar' || mainAction === 'rebanar') {
          taskMap.forEach(potentialPred => {
            if (potentialPred.id !== task.id && potentialPred.normalizedName.endsWith(ingredient)) {
              if (potentialPred.normalizedName.startsWith('lavar') || potentialPred.normalizedName.startsWith('pelar')) {
                newPredecessors.add(potentialPred.id);
              }
            }
          });
        }
        // Regla 2: Procesamiento de Calor
        else if (mainAction === 'sofreir' || mainAction === 'freir' || mainAction === 'hornear' || mainAction === 'asar' || mainAction === 'hervir') {
           taskMap.forEach(potentialPred => {
            if (potentialPred.id !== task.id && potentialPred.normalizedName.endsWith(ingredient)) {
              if (potentialPred.normalizedName.startsWith('picar') || potentialPred.normalizedName.startsWith('cortar') || potentialPred.normalizedName.startsWith('sazonar')) {
                newPredecessors.add(potentialPred.id);
              }
            }
          });
        }
        // Regla 3: Pre-requisitos de Equipo
        if (mainAction === 'hornear' || mainAction === 'freir' || mainAction === 'asar') {
          const equipment = mainAction === 'hornear' ? 'horno' : 'sarten';
          taskMap.forEach(potentialPred => {
            if (potentialPred.id !== task.id && potentialPred.normalizedName === `precalentar ${equipment}`) {
              newPredecessors.add(potentialPred.id);
            }
          });
        }


        if (newPredecessors.size > task.predecessorIds.length) {
          batch.update(doc(tasksCollection, task.id), { predecessorIds: Array.from(newPredecessors) });
          changed = true;
        }
      });
      
      if (project?.cpmResult) {
        batch.update(projectRef, { cpmResult: null });
      }

      await batch.commit();

      if (changed) {
        setIsGuideStale(true);
        toast({ title: '¡Dependencias Nativas Sugeridas!', description: 'Se han añadido dependencias basadas en reglas culinarias.' });
      } else {
        toast({ title: 'Sin Sugerencias Nuevas', description: 'No se encontraron nuevas dependencias lógicas para añadir.' });
        setHistory([]); // No change, so clear history
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error en Sugerencia Nativa', variant: 'destructive' });
      setHistory([]); // Clear history on failure
    } finally {
      setIsSuggestingNatively(false);
    }
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
    saveToHistory('Sugerir dependencias (IA)');
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
      } else {
        setHistory([]); // No change, so clear history
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
      setHistory([]); // Clear history on failure
    } finally {
      setIsSuggesting(false);
    }
  };

  const consolidateTasksNatively = async (): Promise<boolean> => {
    const tasks = (await getDocs(tasksQuery!)).docs.map(d => ({id: d.id, ...d.data()} as Task));
    
    if (tasks.length < 1) {
        return false;
    }

    const prepTasks = tasks.filter(t => !t.isAssemblyStep);

    const taskGroups = new Map<string, Task[]>();
    prepTasks.forEach(task => {
        const normalizedName = normalize(task.name);
        if (!taskGroups.has(normalizedName)) {
            taskGroups.set(normalizedName, []);
        }
        taskGroups.get(normalizedName)!.push(task);
    });

    const batch = writeBatch(firestore);
    const tasksCollection = collection(projectRef, 'tasks');
    const tasksToDelete = new Set<string>();
    const predecessorRedirects = new Map<string, string>();
    let consolidationHappened = false;

    for (const group of taskGroups.values()) {
        if (group.length > 1) {
            consolidationHappened = true;
            const masterTask = group.reduce((a, b) => a.name.length <= b.name.length ? a : b);
            
            const consolidatedData: Partial<Task> & { isConsolidated?: boolean } = {
                name: masterTask.name,
                duration: Math.max(...group.map(t => t.duration)),
                recipeIds: [...new Set(group.flatMap(t => t.recipeIds || []))],
                resourceIds: [...new Set(group.flatMap(t => t.resourceIds || []))],
                isAssemblyStep: false, // Explicitly false for prep tasks
                predecessorIds: [...new Set(group.flatMap(t => t.predecessorIds || []))],
                isConsolidated: true, 
            };
            
            batch.update(doc(tasksCollection, masterTask.id), consolidatedData);
            
            const duplicateTasks = group.filter(t => t.id !== masterTask.id);
            duplicateTasks.forEach(dup => {
                tasksToDelete.add(dup.id);
                predecessorRedirects.set(dup.id, masterTask.id);
            });
        }
    }
    
    if (!consolidationHappened) {
        return false; // No changes to commit
    }

    saveToHistory('Unificar tareas duplicadas');

    const remainingTasks = tasks.filter(t => !tasksToDelete.has(t.id));
    remainingTasks.forEach(task => {
        let needsUpdate = false;
        const newPredecessors = new Set(task.predecessorIds);

        task.predecessorIds.forEach(predId => {
            if (predecessorRedirects.has(predId)) {
                newPredecessors.delete(predId);
                const masterId = predecessorRedirects.get(predId)!;
                if(masterId !== task.id) newPredecessors.add(masterId);
                needsUpdate = true;
            }
        });

        if (newPredecessors.has(task.id)) {
            newPredecessors.delete(task.id);
            needsUpdate = true;
        }

        if (needsUpdate) {
            batch.update(doc(tasksCollection, task.id), { predecessorIds: Array.from(newPredecessors) });
        }
    });
    
    tasksToDelete.forEach(id => {
        batch.delete(doc(tasksCollection, id));
    });

    if (project?.cpmResult) {
        batch.update(projectRef, { cpmResult: null });
    }

    try {
        await batch.commit();
        if(consolidationHappened) {
          toast({ title: '¡Tareas Unificadas!', description: 'Se han fusionado tareas de preparación duplicadas automáticamente.' });
        }
    } catch(e) {
        console.error("Error al consolidar tareas:", e);
        setHistory([]); // Clear history on failure
        toast({ title: 'Error al Unificar', description: 'No se pudieron unificar las tareas.', variant: 'destructive' });
        return false;
    }
    
    return consolidationHappened;
  };

  const handleCalculatePath = async (force = false) => {
    setIsCalculatingPath(true);
    
    try {
        const tasks = allTasks || [];
        if (!force && tasks.length > 1) {
            const tasksWithoutPredecessors = tasks.filter(t => t.predecessorIds.length === 0);
            if (tasksWithoutPredecessors.length === tasks.length) {
                setShowDependencyWarning(true);
                setIsCalculatingPath(false);
                return;
            }
        }

        await consolidateTasksNatively();
        
        const freshTasksSnapshot = await getDocs(tasksQuery!);
        const tasksForCalc = freshTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        
        if (tasksForCalc.length === 0) {
            updateDocumentNonBlocking(projectRef, { cpmResult: { totalDuration: 0, criticalPath: [], tasks: [] } });
            setIsCalculatingPath(false);
            router.push(`/projects/${projectId}/guide`);
            return;
        };

        const cpmResult = calculateCPM(tasksForCalc);
        updateDocumentNonBlocking(projectRef, { cpmResult });
        setIsGuideStale(false);
        router.push(`/projects/${projectId}/guide`);
  
    } catch(error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Revisa la consola para más detalles.";
       if (errorMessage.includes('ciclo de dependencias')) {
          setShowDependencyWarning(true); // Re-use the warning dialog for cycles
        } else {
          toast({
              title: "Error al Iniciar Cálculo",
              description: errorMessage,
              variant: "destructive",
          });
        }
    } finally {
       setIsCalculatingPath(false);
    }
  };

  const handleClearProject = async () => {
    setIsClearing(true);
    saveToHistory('Limpiar proyecto completo');
    try {
      const batch = writeBatch(firestore);
  
      const tasksSnapshot = await getDocs(tasksQuery!);
      tasksSnapshot.forEach(doc => batch.delete(doc.ref));
  
      const recipesSnapshot = await getDocs(recipesQuery!);
      recipesSnapshot.forEach(doc => batch.delete(doc.ref));
  
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
       setHistory([]); // Clear history on failure
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadProject = () => {
    if (!project || !allRecipes || !allTasks) {
      toast({
        title: "Error al Descargar",
        description: "Los datos del proyecto aún no están completamente cargados.",
        variant: "destructive"
      });
      return;
    }

    const projectData = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description
      },
      recipes: allRecipes,
      tasks: allTasks,
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Proyecto Descargado",
      description: `Se ha iniciado la descarga de ${a.download}.`
    });
  };
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        const importRecipeDialog = document.querySelector('[role="dialog"]');
        if (importRecipeDialog) {
            e.preventDefault();
            e.returnValue = 'Hay una importación de receta en progreso. ¿Seguro que quieres salir?';
        }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onImportRecipe]);


  useEffect(() => {
    const currentTasks = allTasks || [];
    if (project && !project.cpmResult && currentTasks.length > 0) {
        if (!isGuideStale) setIsGuideStale(true);
    }
    else if (project && project.cpmResult && project.cpmResult.tasks.length !== currentTasks.length) {
        if (!isGuideStale) setIsGuideStale(true);
    } else if (project?.cpmResult && !isGuideStale) {
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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex-1">
             {isEditingProject ? (
              <div className="space-y-2">
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-3xl font-bold tracking-tight font-headline h-auto p-0 border-0 shadow-none focus-visible:ring-0"
                />
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Añade una descripción..."
                  className="text-muted-foreground"
                />
              </div>
            ) : (
               <div>
                  <h1 className="text-3xl font-bold tracking-tight font-headline">{project.name}</h1>
                  <p className="text-muted-foreground mt-1">{project.description || 'Sin descripción. Haz clic en "Editar" para añadir una.'}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingProject ? (
              <>
                <Button size="sm" onClick={handleSaveProjectDetails}><Save className="mr-2 h-4 w-4"/>Guardar</Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setIsEditingProject(false);
                  setProjectName(project.name);
                  setProjectDescription(project.description || '');
                }}>
                  <X className="mr-2 h-4 w-4"/>Cancelar
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditingProject(true)}>
                <Edit className="mr-2 h-4 w-4"/>Editar
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div/>
          <div className="flex gap-2 flex-wrap">
              <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isClearing}>
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  {isClearing ? 'Borrando...' : 'Borrar Proyecto'}
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
                  <AlertDialogAction onClick={handleClearProject}>
                    Sí, borrar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="secondary" onClick={handleUndo} disabled={history.length === 0 || isUndoing}>
                <Undo className="mr-2 h-4 w-4" />
                {isUndoing ? 'Deshaciendo...' : 'Deshacer'}
            </Button>
            <Button variant="outline" onClick={handleDownloadProject}>
              <Download className="mr-2 h-4 w-4" /> Descargar Proyecto
            </Button>
            <Button variant="outline" onClick={onImportRecipe}>
              <FileUp className="mr-2 h-4 w-4" /> Importar Receta
            </Button>
          </div>
        </div>
      </div>

      <div className="my-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline flex-1">Recetas</h2>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleSuggestDependenciesNatively} disabled={isSuggestingNatively || (allTasks || []).length < 2}>
              <Wand2 className={`mr-2 h-4 w-4 ${isSuggestingNatively ? 'animate-spin' : ''}`} />
              Sugerir Dependencias (Nativo)
            </Button>
            <Button variant="outline" onClick={handleSuggestDependencies} disabled={isSuggesting || (allTasks || []).length < 2}>
              {isSuggesting ? (
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Sugerir Dependencias (IA)
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
                    onDuplicateRecipe={handleDuplicateRecipe}
                    onAddTask={() => handleOpenEditTask('new')}
                    onEditTask={(task) => handleOpenEditTask(task)}
                    onDeleteTask={handleTaskDelete}
                    taskWithUnificationSuggestion={null}
                    onConsolidateTasks={consolidateTasksNatively}
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
            <Button size="lg" variant="destructive" onClick={() => handleCalculatePath(false)} disabled={isCalculatingPath}>
              {isCalculatingPath ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Recalcular Guía
            </Button>
         ) : hasValidGuide ? (
            <Button size="lg" onClick={() => router.push(`/projects/${projectId}/guide`)}>
              Ver Guía <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
         ) : (
            <Button size="lg" onClick={() => handleCalculatePath(false)} disabled={(allTasks || []).length === 0 || isCalculatingPath}>
              {isCalculatingPath ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Calcular Ruta Óptima
            </Button>
         )}
      </div>

       <AlertDialog open={showDependencyWarning} onOpenChange={setShowDependencyWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¡Atención! Posible Ciclo o Dependencias Faltantes</AlertDialogTitle>
                <AlertDialogDescription>
                    Se ha detectado un posible ciclo de dependencias o la mayoría de las tareas no están conectadas. Esto puede resultar en una guía de cocina incorrecta. ¿Qué quieres hacer?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Revisar Manualmente</AlertDialogCancel>
                    <Button variant="outline" disabled>Reparar con IA (Próximamente)</Button>
                    <AlertDialogAction onClick={() => { setShowDependencyWarning(false); handleCalculatePath(true); }}>
                        Calcular de todos modos
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>


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
