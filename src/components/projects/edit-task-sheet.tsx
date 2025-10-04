'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles } from 'lucide-react';
import type { Task, Recipe, UserResource } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { suggestResourceForTask } from '@/ai/flows/suggest-resource-for-task';

interface EditTaskSheetProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
  allTasks: Task[];
  allRecipes: Recipe[];
  allResources: UserResource[];
  onSave: (task: Task) => void;
}

type TimeUnit = 'seconds' | 'minutes';

export default function EditTaskSheet({
  open,
  onOpenChange,
  task,
  allTasks,
  allRecipes,
  allResources,
  onSave,
}: EditTaskSheetProps) {
  const [name, setName] = useState('');
  const [durationValue, setDurationValue] = useState(0);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('minutes');
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [recipeIds, setRecipeIds] = useState<string[]>([]);
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      if (task) {
        setName(task.name);
        if (task.duration < 60 || task.duration % 60 !== 0) {
          setTimeUnit('seconds');
          setDurationValue(task.duration);
        } else {
          setTimeUnit('minutes');
          setDurationValue(task.duration / 60);
        }
        setPredecessorIds(task.predecessorIds);
        setRecipeIds(task.recipeIds || ((task as any).recipeId ? [(task as any).recipeId] : []));
        setResourceIds(task.resourceIds || []);
      } else {
        // Reset for new task
        setName('');
        setDurationValue(5); // Default to 5 minutes
        setTimeUnit('minutes');
        setPredecessorIds([]);
        setRecipeIds(allRecipes[0]?.id ? [allRecipes[0].id] : []);
        setResourceIds([]);
      }
    }
  }, [task, open, allRecipes]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || durationValue <= 0 || recipeIds.length === 0) {
        toast({
            title: "Faltan campos",
            description: "Asegúrate de que la tarea tenga un nombre, duración y al menos una receta asociada.",
            variant: "destructive",
        });
        return;
    }

    const durationInSeconds = timeUnit === 'minutes' ? durationValue * 60 : durationValue;

    onSave({
      id: task?.id || '',
      name,
      duration: durationInSeconds,
      predecessorIds,
      recipeIds: recipeIds,
      resourceIds,
      status: task?.status || 'pending',
    });
  };

  const handleSuggestResources = async () => {
    if (!name) {
        toast({ title: "Falta el nombre", description: "Escribe un nombre para la tarea antes de pedir sugerencias.", variant: "destructive" });
        return;
    };
    setIsSuggesting(true);
    try {
        const result = await suggestResourceForTask({ 
            taskName: name,
            userResources: allResources
        });
        if (result.resourceIds.length > 0) {
            setResourceIds(prev => [...new Set([...prev, ...result.resourceIds])]);
            toast({ title: 'Sugerencias Añadidas', description: 'La IA ha añadido nuevos recursos a esta tarea.' });
        } else {
            toast({ title: 'Sin Sugerencias', description: 'La IA no encontró recursos relevantes para esta tarea.' });
        }
    } catch(e) {
        toast({ title: 'Error de IA', description: 'No se pudieron obtener sugerencias.', variant: 'destructive' });
    } finally {
        setIsSuggesting(false);
    }
  }

  const availablePredecessors = allTasks.filter(t => t.id !== task?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">{task && task.id ? 'Editar Tarea' : 'Añadir Nueva Tarea'}</SheetTitle>
          <SheetDescription>
            Rellena los detalles de tu tarea de cocina.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4">
          <div className="space-y-4 py-4 flex-grow">
            <div>
                <Label htmlFor="recipeId">Receta(s)</Label>
                <Select onValueChange={(value) => {
                  if (value && !recipeIds.includes(value)) {
                    setRecipeIds(prev => [...prev, value])
                  }
                }}>
                    <SelectTrigger id="recipeId" className="mt-1">
                        <SelectValue placeholder="Asignar a una receta" />
                    </SelectTrigger>
                    <SelectContent>
                        {allRecipes.filter(r => !recipeIds.includes(r.id)).map(recipe => (
                            <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <div className="mt-2 flex flex-wrap gap-1">
                {recipeIds.map(rId => {
                  const recipe = allRecipes.find(r => r.id === rId);
                  return (
                    <Badge key={rId} variant="secondary">
                      {recipe?.name}
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                        onClick={() => setRecipeIds(prev => prev.filter(id => id !== rId))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="name">Nombre de la Tarea</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className='flex items-end gap-2'>
              <div className='flex-grow'>
                <Label htmlFor="duration">Duración</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationValue}
                  onChange={(e) => setDurationValue(Number(e.target.value))}
                  required
                  min="1"
                  className="mt-1"
                />
              </div>
              <Select value={timeUnit} onValueChange={(value: TimeUnit) => setTimeUnit(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Segundos</SelectItem>
                  <SelectItem value="minutes">Minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>Recursos Requeridos</Label>
                 <Button type="button" size="sm" variant="ghost" onClick={handleSuggestResources} disabled={isSuggesting || !name}>
                    {isSuggesting ? <Sparkles className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Sugerencia IA
                </Button>
              </div>
               <Select onValueChange={(value) => {
                  if (value && !resourceIds.includes(value)) {
                    setResourceIds(prev => [...prev, value])
                  }
                }}>
                <SelectTrigger id="resources" >
                  <SelectValue placeholder="Añadir un recurso" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {allResources.filter(r => !resourceIds.includes(r.id)).map(res => (
                      <SelectItem key={res.id} value={res.id}>
                        {res.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-1">
                {resourceIds.map(rId => {
                  const resource = allResources.find(r => r.id === rId);
                  return (
                    <Badge key={rId} variant="secondary">
                      {resource?.name}
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                        onClick={() => setResourceIds(prev => prev.filter(id => id !== rId))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Dependencias (Predecesores)</Label>
              <Select onValueChange={(value) => {
                  if (value && !predecessorIds.includes(value)) {
                    setPredecessorIds(prev => [...prev, value])
                  }
                }}>
                <SelectTrigger id="predecessors" className="mt-1">
                  <SelectValue placeholder="Añadir una tarea predecesora" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {availablePredecessors.filter(p => !predecessorIds.includes(p.id)).map(pTask => (
                      <SelectItem key={pTask.id} value={pTask.id}>
                        {pTask.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-1">
                {predecessorIds.map(pId => {
                  const pTask = allTasks.find(t => t.id === pId);
                  return (
                    <Badge key={pId} variant="secondary">
                      {pTask?.name}
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                        onClick={() => setPredecessorIds(prev => prev.filter(id => id !== pId))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </SheetClose>
            <Button type="submit">Guardar Tarea</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
