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
import { X, Check, ChevronsUpDown, Sparkles, Wand2 } from 'lucide-react';
import type { Task, Recipe, UserResource } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { suggestResourceForTask } from '@/ai/flows/suggest-resource-for-task';
import { suggestPredecessorsForTask } from '@/ai/flows/suggest-predecessors-for-task';

const normalize = (str: string) => {
    if (!str) return '';
    const stopWords = [
      'la', 'el', 'un', 'una', 'de', 'para', 'los', 'las', 'a', 'con', 'en',
      'olla', 'sarten', 'horno', 'bol', 'tabla', 'cuchillo'
    ];
    const regex = new RegExp(`\\b(${stopWords.join('|')})\\b`, 'g');
    
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,¡!¿]/g, '')
        .replace(regex, '')
        .trim().replace(/\s+/g, ' ');
};


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
  const [isSuggestingResources, setIsSuggestingResources] = useState(false);
  const [isSuggestingPreds, setIsSuggestingPreds] = useState(false);
  const [isSuggestingPredsNatively, setIsSuggestingPredsNatively] = useState(false);
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
    setIsSuggestingResources(true);
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
        setIsSuggestingResources(false);
    }
  }

  const handleSuggestPredecessors = async () => {
    if (!name) {
        toast({ title: "Falta el nombre", description: "Escribe un nombre para la tarea antes de pedir sugerencias.", variant: "destructive" });
        return;
    };
    const existingTasks = allTasks.filter(t => t.id !== task?.id);
    if (existingTasks.length === 0) {
        toast({ title: "No hay otras tareas", description: "No hay otras tareas en el proyecto para establecer como dependencias.", variant: "destructive" });
        return;
    }
    setIsSuggestingPreds(true);
    try {
        const result = await suggestPredecessorsForTask({ 
            newTaskName: name, 
            existingTasks: existingTasks.map(t => ({ id: t.id, name: t.name })) 
        });
        if (result.predecessorIds.length > 0) {
            setPredecessorIds(prev => [...new Set([...prev, ...result.predecessorIds])]);
            toast({ title: 'Dependencias Sugeridas', description: 'La IA ha sugerido nuevas dependencias.' });
        } else {
            toast({ title: 'Sin Sugerencias', description: 'La IA no encontró dependencias lógicas para esta tarea.' });
        }
    } catch(e) {
        console.error(e);
        toast({ title: 'Error de IA', description: 'No se pudieron obtener sugerencias de dependencias.', variant: 'destructive' });
    } finally {
        setIsSuggestingPreds(false);
    }
  }

  const handleSuggestPredecessorsNatively = () => {
    if (!name) {
        toast({ title: "Falta el nombre", description: "Escribe un nombre para la tarea antes de pedir sugerencias.", variant: "destructive" });
        return;
    }
    const otherTasks = allTasks.filter(t => t.id !== task?.id);
    if (otherTasks.length === 0) {
        toast({ title: "No hay otras tareas", description: "No hay otras tareas para establecer como dependencias." });
        return;
    }

    setIsSuggestingPredsNatively(true);
    const newPredecessors = new Set(predecessorIds);
    const taskWords = normalize(name).split(' ');
    const mainAction = taskWords[0];
    const ingredient = taskWords.slice(1).join(' ');

    const taskMap = new Map(otherTasks.map(t => [t.id, { ...t, normalizedName: normalize(t.name) }]));

    let foundSuggestion = false;

    // Regla 1: Preparación Básica antes de Corte
    if (mainAction === 'picar' || mainAction === 'cortar' || mainAction === 'rebanar') {
      taskMap.forEach(potentialPred => {
        if (potentialPred.normalizedName.endsWith(ingredient) && (potentialPred.normalizedName.startsWith('lavar') || potentialPred.normalizedName.startsWith('pelar'))) {
          newPredecessors.add(potentialPred.id);
          foundSuggestion = true;
        }
      });
    }
    // Regla 2: Procesamiento de Calor
    else if (mainAction === 'sofreir' || mainAction === 'freir' || mainAction === 'hornear' || mainAction === 'asar' || mainAction === 'hervir') {
       taskMap.forEach(potentialPred => {
        if (potentialPred.normalizedName.endsWith(ingredient) && (potentialPred.normalizedName.startsWith('picar') || potentialPred.normalizedName.startsWith('cortar') || potentialPred.normalizedName.startsWith('sazonar'))) {
          newPredecessors.add(potentialPred.id);
          foundSuggestion = true;
        }
      });
    }
    // Regla 3: Pre-requisitos de Equipo
    if (mainAction === 'hornear' || mainAction === 'freir' || mainAction === 'asar') {
      const equipment = mainAction === 'hornear' ? 'horno' : 'sarten';
      taskMap.forEach(potentialPred => {
        if (potentialPred.normalizedName === `precalentar ${equipment}`) {
          newPredecessors.add(potentialPred.id);
          foundSuggestion = true;
        }
      });
    }

    setPredecessorIds(Array.from(newPredecessors));
    
    if (foundSuggestion) {
        toast({ title: 'Dependencias Nativas Sugeridas', description: 'Se han añadido dependencias basadas en reglas culinarias.' });
    } else {
        toast({ title: 'Sin Sugerencias Nuevas', description: 'No se encontraron nuevas dependencias lógicas para añadir.' });
    }
    
    setIsSuggestingPredsNatively(false);
};


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
                   <Button type="button" size="sm" variant="ghost" onClick={handleSuggestResources} disabled={isSuggestingResources || !name}>
                        {isSuggestingResources ? <Sparkles className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                        Sugerencia IA
                    </Button>
                </div>
                 <MultiSelectPopover 
                    title="recursos"
                    options={availableResources}
                    selected={resourceIds}
                    onSelectedChange={setResourceIds}
                  />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                    <Label>Dependencias (Predecesores)</Label>
                    <div className="flex gap-1">
                        <Button type="button" size="sm" variant="ghost" onClick={handleSuggestPredecessorsNatively} disabled={isSuggestingPredsNatively || !name}>
                            {isSuggestingPredsNatively ? <Wand2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                            Nativo
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={handleSuggestPredecessors} disabled={isSuggestingPreds || !name}>
                            {isSuggestingPreds ? <Sparkles className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                            IA
                        </Button>
                    </div>
                </div>
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

    