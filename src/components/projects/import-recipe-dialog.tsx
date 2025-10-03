'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { parseRecipe } from '@/ai/flows/parse-recipe';
import type { Project } from '@/lib/types';
import { saveProject } from '@/lib/data';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ImportRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export default function ImportRecipeDialog({ open, onOpenChange, project }: ImportRecipeDialogProps) {
  const [recipeText, setRecipeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleImport = async () => {
    if (!recipeText.trim()) {
      toast({
        title: 'Recipe text is empty',
        description: 'Please paste the recipe text into the box.',
        variant: 'destructive',
      });
      return;
    }
    setIsParsing(true);
    try {
      const result = await parseRecipe({ recipeText });
      
      const newRecipeId = `rec_${Date.now()}`;
      
      const newTasks = result.tasks.map(t => ({
        id: `task_${Date.now()}_${Math.random()}`,
        name: t.name,
        duration: t.duration,
        recipeId: newRecipeId,
        predecessorIds: [],
        status: 'pending' as const,
      }));

      const newRecipe = {
        id: newRecipeId,
        name: result.recipeName,
      };

      const updatedProject = {
        ...project,
        recipes: [...project.recipes, newRecipe],
        tasks: [...project.tasks, ...newTasks],
      };
      
      saveProject(updatedProject);

      toast({
        title: 'Recipe Imported!',
        description: `Successfully imported "${result.recipeName}" and added ${newTasks.length} tasks.`,
      });

      onOpenChange(false);
      setRecipeText('');
      // Force a re-render by navigating to the same page
      router.refresh();

    } catch (error) {
      console.error('Failed to parse recipe', error);
      toast({
        title: 'Import Failed',
        description: 'Could not parse the recipe. Please check the format or try again.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Import Recipe</DialogTitle>
          <DialogDescription>
            Paste the full text of your recipe below. The AI will parse it to extract the name and tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Paste your recipe here..."
            className="min-h-[250px] text-sm"
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isParsing}>Cancel</Button>
          <Button onClick={handleImport} disabled={isParsing || !recipeText.trim()}>
            {isParsing ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Parsing...
              </>
            ) : 'Import Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
