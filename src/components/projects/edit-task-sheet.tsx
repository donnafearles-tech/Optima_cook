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
      'olla', 'sarten', 'horno', 'bol', 'tabla', 'cuchillo', 'primera', 'segunda', 'tercera',
      'rebanada', 'loncha', 'pieza'
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
            {`Seleccionar ${title}...`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
    if (open && task && task.id) {
        const allTaskIds = new Set(allTasks.map(t => t.id));
        const currentPredecessors = task.predecessorIds || [];
        const validPredecessorIds = currentPredecessors.filter(id => allTaskIds.has(id));

        if (validPredecessorIds.length < currentPredecessors.length) {
            toast({
                title: "Dependencias limpiadas",
                description: "Se eliminaron dependencias que apuntaban a tareas borradas.",
                variant: 'default',
            });
            // Directly call onSave to persist the cleanup, this will trigger a re-render
            onSave({ ...task, predecessorIds: validPredecessorIds });
        }
        
        setPredecessorIds(validPredecessorIds);
    }

    if (open) {
      if (task) {
        setName(task.name || '');
        const duration = task.duration || 300;
        if (duration < 60 || duration % 60 !== 0) {
            setTimeUnit('seconds');
            setDurationValue(duration);
        } else {
            setTimeUnit('minutes');
            setDurationValue(duration / 60);
        }
        // If it's an existing task, use its predecessors, otherwise use the cleaned ones.
        setPredecessorIds(task.id ? predecessorIds : (task.predecessorIds || []));
        setRecipeIds(task.recipeIds || ((task as any).recipeId ? [(task as any).recipeId] : allRecipes[0]?.id ? [allRecipes[0].id] : []));
        setResourceIds(task.resourceIds || []);

      } else { // Reset for new task
        setName('');
        setDurationValue(5);
        setTimeUnit('minutes');
        setPredecessorIds([]);
        setRecipeIds(allRecipes[0]?.id ? [allRecipes[0].id] : []);
        setResourceIds([]);
      }
    }
  }, [task, open, allRecipes, allTasks, onSave, toast]);



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
    
    // crucial: filter tasks to only those within the same recipe(s) as the current task
    const relevantTasks = allTasks.filter(t => 
        t.id !== task?.id && (t.recipeIds || []).some(rId => (recipeIds || []).includes(rId))
    );

    if (relevantTasks.length === 0) {
        toast({ title: "No hay otras tareas en esta receta", description: "No hay otras tareas en la misma receta para establecer como dependencias." });
        return;
    }

    setIsSuggestingPredsNatively(true);
    
    const newPredecessors = new Set(predecessorIds);
    const normalizedNewTaskName = normalize(name);
    let foundSuggestion = false;

    const relevantTaskMap = new Map(relevantTasks.map(t => [t.id, { ...t, normalizedName: normalize(t.name) }]));
    
    const isAction = (normalized: string, verbs: string[]) => verbs.some(v => normalized.startsWith(v));
    const isIngredientAction = (normalized: string) => isAction(normalized, ['colocar', 'añadir', 'poner', 'agregar']);

    // Reglas de Preparación y Cocción
    if (isAction(normalizedNewTaskName, ['picar', 'cortar', 'rebanar'])) {
        const ingredient = normalizedNewTaskName.split(' ').slice(1).join(' ');
        relevantTaskMap.forEach(potentialPred => {
            if (potentialPred.normalizedName.endsWith(ingredient) && isAction(potentialPred.normalizedName, ['lavar', 'pelar'])) {
                newPredecessors.add(potentialPred.id);
                foundSuggestion = true;
            }
        });
    } else if (isAction(normalizedNewTaskName, ['sofreir', 'freir', 'hornear', 'asar', 'hervir'])) {
        const ingredient = normalizedNewTaskName.split(' ').slice(1).join(' ');
        relevantTaskMap.forEach(potentialPred => {
            if (potentialPred.normalizedName.endsWith(ingredient) && isAction(potentialPred.normalizedName, ['picar', 'cortar', 'sazonar', 'rebanar'])) {
                newPredecessors.add(potentialPred.id);
                foundSuggestion = true;
            }
        });
    }

    // Reglas de Equipos
    if (isAction(normalizedNewTaskName, ['hornear', 'freir', 'asar'])) {
      const equipment = isAction(normalizedNewTaskName, ['hornear']) ? 'horno' : 'sarten';
      relevantTaskMap.forEach(potentialPred => {
        if (potentialPred.normalizedName === `precalentar ${equipment}`) {
          newPredecessors.add(potentialPred.id);
          foundSuggestion = true;
        }
      });
    }
    
    // Reglas de Ensamblaje
    if (isIngredientAction(normalizedNewTaskName)) {
        relevantTaskMap.forEach(potentialPred => {
            // Depend on adhesive tasks
            if (isAction(potentialPred.normalizedName, ['untar', 'esparcir'])) {
                newPredecessors.add(potentialPred.id);
                foundSuggestion = true;
            }
            // Depend on other layer tasks
            if (isIngredientAction(potentialPred.normalizedName)) {
                 newPredecessors.add(potentialPred.id);
                 foundSuggestion = true;
            }
             // Depend on base tasks
            if (isAction(potentialPred.normalizedName, ['tostar'])) {
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

  const selectedRecipeLabels = useMemo(() => 
    recipeIds.map(id => availableRecipes.find(r => r.value === id)?.label).filter(Boolean),
    [recipeIds, availableRecipes]
  );

  const selectedResourceLabels = useMemo(() =>
    resourceIds.map(id => availableResources.find(r => r.value === id)?.label).filter(Boolean),
    [resourceIds, availableResources]
  );

  const selectedPredecessorLabels = useMemo(() =>
    predecessorIds.map(id => availablePredecessors.find(p => p.value === id)?.label).filter(Boolean),
    [predecessorIds, availablePredecessors]
  );


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">{task && task.id ? 'Editar Tarea' : 'Añadir Nueva Tarea'}</SheetTitle>
          <SheetDescription>
            Rellena los detalles de tu tarea de cocina.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow -mx-6 px-6">
          <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4 py-4">
            <div className="space-y-4">
              <div>
                  <Label htmlFor="recipeId">Receta(s)</Label>
                   <MultiSelectPopover 
                    title="recetas"
                    options={availableRecipes}
                    selected={recipeIds}
                    onSelectedChange={setRecipeIds}
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedRecipeLabels.map((label, index) => (
                      <Badge key={`${label}-${index}`} variant="secondary">
                        {label}
                        <button
                          type="button"
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                          onClick={() => setRecipeIds(prev => prev.filter(id => availableRecipes.find(r=>r.value===id)?.label !== label))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
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
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedResourceLabels.map((label) => (
                      <Badge key={label} variant="secondary">
                        {label}
                        <button
                          type="button"
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                           onClick={() => setResourceIds(prev => prev.filter(id => availableResources.find(r=>r.value===id)?.label !== label))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
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
                 <div className="mt-2 flex flex-wrap gap-1">
                    {selectedPredecessorLabels.map((label) => (
                       <Badge key={label} variant="secondary">
                        {label}
                        <button
                          type="button"
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                           onClick={() => setPredecessorIds(prev => prev.filter(id => availablePredecessors.find(p=>p.value===id)?.label !== label))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
              </div>
            </div>
          </form>
        </ScrollArea>
        <SheetFooter className='pt-4'>
          <SheetClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
          </SheetClose>
          <Button type="submit" onClick={handleSubmit}>Guardar Tarea</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

    