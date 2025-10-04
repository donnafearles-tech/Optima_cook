'use client';
import { useEffect, useState, useMemo } from 'react';
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
import { X, Check, ChevronsUpDown, Sparkles } from 'lucide-react';
import type { Task, Recipe, UserResource } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
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

function MultiSelectPopover({ title, options, selected, onSelectedChange }: { title: string, options: { value: string, label: string }[], selected: string[], onSelectedChange: (selected: string[]) => void }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (currentValue: string) => {
    const newSelected = selected.includes(currentValue)
      ? selected.filter((value) => value !== currentValue)
      : [...selected, currentValue];
    onSelectedChange(newSelected);
  };
  
  const selectedLabels = selected.map(value => options.find(opt => opt.value === value)?.label).filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
           <span className="truncate">
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : `Seleccionar ${title}...`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`Buscar ${title}...`} />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


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
    if (!allResources || allResources.length === 0) {
        toast({ title: "No hay recursos", description: "No tienes recursos en tu inventario para sugerir.", variant: "destructive" });
        return;
    }
    setIsSuggesting(true);
    try {
        const result = await suggestResourceForTask({ taskName: name, userResources: allResources });
        if (result.resourceIds.length > 0) {
            setResourceIds(prev => [...new Set([...prev, ...result.resourceIds])]);
            toast({ title: 'Sugerencias Añadidas', description: 'La IA ha añadido nuevos recursos a esta tarea.' });
        } else {
            toast({ title: 'Sin Sugerencias', description: 'La IA no encontró recursos relevantes para esta tarea.' });
        }
    } catch(e) {
        console.error(e);
        toast({ title: 'Error de IA', description: 'No se pudieron obtener sugerencias.', variant: 'destructive' });
    } finally {
        setIsSuggesting(false);
    }
  }

  const availablePredecessors = useMemo(() => 
    allTasks
        .filter(t => t.id !== task?.id)
        .map(t => ({ value: t.id, label: t.name })), 
    [allTasks, task]
  );
  
  const availableRecipes = useMemo(() => allRecipes.map(r => ({ value: r.id, label: r.name })), [allRecipes]);
  const availableResources = useMemo(() => allResources.map(r => ({ value: r.id, label: r.name })), [allResources]);


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">{task && task.id ? 'Editar Tarea' : 'Añadir Nueva Tarea'}</SheetTitle>
          <SheetDescription>
            Rellena los detalles de tu tarea de cocina.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4 px-1 py-4">
            <div className="space-y-4">
              <div>
                  <Label htmlFor="recipeId">Receta(s)</Label>
                  <MultiSelectPopover 
                    title="recetas"
                    options={availableRecipes}
                    selected={recipeIds}
                    onSelectedChange={setRecipeIds}
                  />
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
                   
                </div>
                 <MultiSelectPopover 
                    title="recursos"
                    options={availableResources}
                    selected={resourceIds}
                    onSelectedChange={setResourceIds}
                  />
              </div>

              <div>
                <Label>Dependencias (Predecesores)</Label>
                <MultiSelectPopover
                    title="predecesores"
                    options={availablePredecessors}
                    selected={predecessorIds}
                    onSelectedChange={setPredecessorIds}
                />
              </div>
            </div>
          </form>
        </ScrollArea>
        <SheetFooter>
          <SheetClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
          </SheetClose>
          <Button type="submit" onClick={handleSubmit}>Guardar Tarea</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
