'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import type { Project, Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskDependencies } from '@/ai/flows/suggest-task-dependencies';
import { calculateCPM } from '@/lib/cpm';
import TasksTable from './tasks-table';
import EditTaskSheet from './edit-task-sheet';
import { SuggestTaskDependenciesOutput } from '@/lib/types';
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

interface ProjectClientPageProps {
  project: Project;
}

export default function ProjectClientPage({ project }: ProjectClientPageProps) {
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleTaskSave = (taskToSave: Task) => {
    const tasksCollection = collection(firestore, 'tasks');
    if (taskToSave.id) {
        const taskDoc = doc(tasksCollection, taskToSave.id);
        // Exclude id from the data being saved
        const { id, ...dataToSave } = taskToSave;
        updateDocumentNonBlocking(taskDoc, dataToSave);
    } else {
        const { id, ...dataToSave } = taskToSave;
        addDocumentNonBlocking(tasksCollection, {...dataToSave, projectId: project.id});
    }
    setEditingTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    const taskDoc = doc(firestore, 'tasks', taskId);
    deleteDocumentNonBlocking(taskDoc);
    
    // This part is tricky without a transaction, as we need to update other tasks
    // For simplicity, we'll rely on users to manually update dependencies for now.
    // A more robust solution would use a Firebase Function for this.
    toast({
        title: 'Tarea Eliminada',
        description: 'Recuerda revisar las dependencias de otras tareas.',
    });
  };
  
  const handleSuggestDependencies = async () => {
    if (project.tasks.length < 2) {
      toast({
        title: 'No hay suficientes tareas',
        description: 'Necesitas al menos dos tareas para sugerir dependencias.',
        variant: 'destructive'
      });
      return;
    }
    setIsSuggesting(true);
    try {
      const taskList = project.tasks.map(t => t.name);
      const result: SuggestTaskDependenciesOutput = await suggestTaskDependencies({ recipeName: project.name, taskList });
      
      const taskNameMap = new Map(project.tasks.map(t => [t.name, t.id]));
      const batch = writeBatch(firestore);

      project.tasks.forEach(task => {
        const suggestedPredNames = result[task.name] || [];
        const predecessorIds = suggestedPredNames
          .map(name => taskNameMap.get(name))
          .filter((id): id is string => !!id && id !== task.id);
        
        const taskRef = doc(firestore, 'tasks', task.id);
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
    const cpmResult = calculateCPM(project.tasks);
    const projectRef = doc(firestore, 'projects', project.id);
    updateDocumentNonBlocking(projectRef, { cpmResult });
    router.push(`/projects/${project.id}/guide`);
  };

  return (
    <>
      <div className="my-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Tareas</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSuggestDependencies} disabled={isSuggesting}>
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
          tasks={project.tasks}
          onEditTask={(task) => setEditingTask(task)}
          onDeleteTask={handleTaskDelete}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={handleCalculatePath} disabled={project.tasks.length === 0}>
          Calcular Ruta Óptima <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <EditTaskSheet
        open={editingTask !== null}
        onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
        task={editingTask === 'new' ? null : editingTask}
        allTasks={project.tasks}
        onSave={handleTaskSave}
      />
    </>
  );
}
