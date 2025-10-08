'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Plus, Hammer, Combine, Copy, Move } from 'lucide-react';
import type { Recipe, Task, UserResource } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface RecipeCardProps {
    recipe: Recipe;
    tasks: Task[];
    allTasks: Task[];
    allRecipes: Recipe[];
    allResources: UserResource[];
    onEditRecipe: () => void;
    onDeleteRecipe: () => void;
    onDuplicateRecipe: (recipeId: string) => void;
    onAddTask: () => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    taskWithUnificationSuggestion: string | null;
    onConsolidateTasks: () => Promise<boolean>;
}

function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`.trim();
}

export default function RecipeCard({
    recipe,
    tasks,
    allTasks,
    allRecipes,
    allResources,
    onEditRecipe,
    onDeleteRecipe,
    onDuplicateRecipe,
    onAddTask,
    onEditTask,
    onDeleteTask,
    taskWithUnificationSuggestion,
    onConsolidateTasks
}: RecipeCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="font-headline">{recipe.name}</CardTitle>
          <CardDescription>{tasks.length} paso(s)</CardDescription>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditRecipe}>
                    <Edit className="mr-2 h-4 w-4" /> Editar Receta
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onDuplicateRecipe(recipe.id)}>
                    <Copy className="mr-2 h-4 w-4" /> Duplicar Receta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDeleteRecipe} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Receta
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
            <div className="space-y-2">
                {tasks.map(task => {
                     const predecessors = task.predecessorIds.map(
                        (pId) => allTasks.find((t) => t.id === pId)?.name
                      ).filter(Boolean);
                      
                     const resources = (task.resourceIds || []).map(
                        (rId) => allResources.find((r) => r.id === rId)?.name
                     ).filter(Boolean);

                     const recipes = (task.recipeIds || []).map(
                        (rId) => allRecipes.find((r) => r.id === rId)?.name
                     ).filter(Boolean);

                    return (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                           <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{task.name}</p>
                                  {task.isConsolidated && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      <Combine className="mr-1 h-3 w-3" />
                                      Unificada
                                    </Badge>
                                  )}
                                  {task.isConsolidated && recipes.length > 1 && (
                                     <div className="flex items-center gap-1">
                                        {recipes.map(rName => <Badge key={rName} variant="outline">{rName}</Badge>)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-xs text-muted-foreground">
                                    <span>Duración: {formatDuration(task.duration)}</span>
                                    {recipes.length > 1 && !task.isConsolidated && (
                                         <div className="flex items-center gap-1">
                                            <span>Recetas:</span>
                                            {recipes.map(rName => <Badge key={rName} variant="outline">{rName}</Badge>)}
                                        </div>
                                    )}
                                    {predecessors.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span>Depende de:</span>
                                            {predecessors.map(pName => <Badge key={pName} variant="secondary">{pName}</Badge>)}
                                        </div>
                                    )}
                                    {resources.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Hammer className="h-3 w-3" />
                                            {resources.map(rName => <Badge key={rName} variant="outline">{rName}</Badge>)}
                                        </div>
                                    )}
                                </div>
                           </div>
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEditTask(task)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar Tarea
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Tarea
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )
                })}
            </div>
        ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
                Esta receta aún no tiene pasos.
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Paso o Actividad
        </Button>
      </CardFooter>
    </Card>
  );
}
