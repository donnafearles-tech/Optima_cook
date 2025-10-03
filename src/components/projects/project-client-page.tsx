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

interface ProjectClientPageProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

export default function ProjectClientPage({ project: initialProject, onProjectUpdate }: ProjectClientPageProps) {
  const [project, setProjectState] = useState<Project>(initialProject);
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleProjectChange = (updatedProject: Project) => {
    setProjectState(updatedProject);
    onProjectUpdate(updatedProject);
  }

  const handleTaskSave = (taskToSave: Task) => {
    let updatedTasks: Task[];
    if (taskToSave.id && project.tasks.some(t => t.id === taskToSave.id)) {
      updatedTasks = project.tasks.map(t => (t.id === taskToSave.id ? taskToSave : t));
    } else {
      updatedTasks = [...project.tasks, { ...taskToSave, id: `task_${Date.now()}` }];
    }
    handleProjectChange({ ...project, tasks: updatedTasks });
    setEditingTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    const updatedTasks = project.tasks.filter(t => t.id !== taskId)
      // Also remove from dependencies of other tasks
      .map(t => ({...t, predecessorIds: t.predecessorIds.filter(id => id !== taskId)}));
    
    handleProjectChange({ ...project, tasks: updatedTasks });
  };
  
  const handleSuggestDependencies = async () => {
    if (project.tasks.length < 2) {
      toast({
        title: 'Not enough tasks',
        description: 'You need at least two tasks to suggest dependencies.',
        variant: 'destructive'
      });
      return;
    }
    setIsSuggesting(true);
    try {
      const taskList = project.tasks.map(t => t.name);
      const result: SuggestTaskDependenciesOutput = await suggestTaskDependencies({ recipeName: project.name, taskList });
      
      const taskNameMap = new Map(project.tasks.map(t => [t.name, t.id]));
      
      const updatedTasks = project.tasks.map(task => {
        const suggestedPredNames = result[task.name] || [];
        const predecessorIds = suggestedPredNames
          .map(name => taskNameMap.get(name))
          .filter((id): id is string => !!id && id !== task.id);
        return { ...task, predecessorIds };
      });
      
      handleProjectChange({ ...project, tasks: updatedTasks });

      toast({
        title: 'Dependencies Suggested!',
        description: 'AI has suggested task dependencies. Review and adjust as needed.',
      });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Suggestion Failed',
        description: 'Could not get AI suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCalculatePath = () => {
    const cpmResult = calculateCPM(project.tasks);
    handleProjectChange({ ...project, cpmResult });
    router.push(`/projects/${project.id}/guide`);
  };

  return (
    <>
      <div className="my-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Tasks</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSuggestDependencies} disabled={isSuggesting}>
              {isSuggesting ? (
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Suggest Dependencies
            </Button>
            <Button onClick={() => setEditingTask('new')}>Add Task</Button>
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
          Calculate Optimal Route <ArrowRight className="ml-2 h-4 w-4" />
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
