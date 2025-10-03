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
import { X } from 'lucide-react';
import type { Task, Recipe } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface EditTaskSheetProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
  allTasks: Task[];
  recipes: Recipe[];
  onSave: (task: Task) => void;
}

type TimeUnit = 'seconds' | 'minutes';

export default function EditTaskSheet({
  open,
  onOpenChange,
  task,
  allTasks,
  recipes,
  onSave,
}: EditTaskSheetProps) {
  const [name, setName] = useState('');
  const [durationValue, setDurationValue] = useState(0);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('minutes');
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [recipeId, setRecipeId] = useState('');

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
        setRecipeId(task.recipeId)
      } else {
        // Reset for new task
        setName('');
        setDurationValue(5); // Default to 5 minutes
        setTimeUnit('minutes');
        setPredecessorIds([]);
        setRecipeId(recipes.length > 0 ? recipes[0].id : '');
      }
    }
  }, [task, open, recipes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || durationValue <= 0 || !recipeId) {
        // Add validation feedback
        return;
    }

    const durationInSeconds = timeUnit === 'minutes' ? durationValue * 60 : durationValue;

    onSave({
      id: task?.id || '',
      name,
      duration: durationInSeconds,
      predecessorIds,
      recipeId: recipeId,
      status: task?.status || 'pending',
    });
  };

  const availablePredecessors = allTasks.filter(t => t.id !== task?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">{task ? 'Editar Tarea' : 'Añadir Nueva Tarea'}</SheetTitle>
          <SheetDescription>
            Rellena los detalles de tu tarea de cocina.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4">
          <div className="space-y-4 py-4 flex-grow">
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
              <Label htmlFor="recipeId">Receta</Label>
               <Select value={recipeId} onValueChange={setRecipeId} required>
                <SelectTrigger id="recipeId" className="mt-1">
                  <SelectValue placeholder="Selecciona una receta" />
                </SelectTrigger>
                <SelectContent>
                  {recipes.map(recipe => (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="predecessors">Dependencias</Label>
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
