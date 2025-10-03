'use client';
import { useState, useRef } from 'react';
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
import type { Project, Task, ParseRecipeOutput } from '@/lib/types';
import { Sparkles, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file';

interface ImportRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

export default function ImportRecipeDialog({ open, onOpenChange, project, onProjectUpdate }: ImportRecipeDialogProps) {
  const [recipeText, setRecipeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = async (textToParse: string) => {
     if (!textToParse.trim()) {
      toast({
        title: 'No text to parse',
        description: 'Please paste or upload a recipe.',
        variant: 'destructive',
      });
      return;
    }
    setIsParsing(true);
    try {
      const result: ParseRecipeOutput = await parseRecipe({ recipeText: textToParse });
      
      const newRecipeId = `rec_${Date.now()}`;
      
      const newTasks: Task[] = result.tasks.map(t => ({
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

      const updatedProject: Project = {
        ...project,
        recipes: [...project.recipes, newRecipe],
        tasks: [...project.tasks, ...newTasks],
      };
      
      onProjectUpdate(updatedProject);

      toast({
        title: 'Recipe Imported!',
        description: `Successfully imported "${result.recipeName}" and added ${newTasks.length} tasks.`,
      });

      onOpenChange(false);
      setRecipeText('');
      setFileName('');
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileDataUri = e.target?.result as string;
        try {
            const { text } = await extractTextFromFile({ fileDataUri });
            setRecipeText(text);
            toast({
              title: "File processed",
              description: "Text has been extracted. Review and click Import."
            })
        } catch (error) {
            console.error("Error extracting text from file", error);
            toast({
                title: "File Read Error",
                description: "Could not extract text from the uploaded file.",
                variant: "destructive",
            });
        } finally {
            setIsParsing(false);
        }
    };
    reader.onerror = () => {
        console.error("FileReader error");
        toast({
            title: "File Read Error",
            description: "An error occurred while reading the file.",
            variant: "destructive",
        });
        setIsParsing(false);
    };
    reader.readAsDataURL(file);
  }

  const handleImportClick = () => {
    handleParse(recipeText);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Import Recipe</DialogTitle>
          <DialogDescription>
            Paste your recipe, or upload a file. The AI will parse it to extract the name and tasks.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="paste">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Text</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="py-4">
                <Textarea
                    placeholder="Paste your recipe here..."
                    className="min-h-[250px] text-sm"
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                />
            </TabsContent>
            <TabsContent value="upload" className="py-4">
                <div className="min-h-[250px] flex flex-col gap-4">
                  <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground mb-2">
                        {fileName ? `Selected: ${fileName}` : "Upload a .txt, .pdf, .xlsx, .docx, .png, or .jpg file"}
                      </p>
                      <Button type="button" onClick={() => fileInputRef.current?.click()}>
                          Browse Files
                      </Button>
                      <Input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".txt,.pdf,.xlsx,.docx,.png,.jpg,.jpeg"
                      />
                  </div>
                  {recipeText && (
                      <div className="relative">
                          <Label>Extracted Text (preview)</Label>
                          <Textarea
                              readOnly
                              value={recipeText}
                              className="mt-1 h-32 text-xs bg-muted"
                          />
                      </div>
                  )}
                </div>
            </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isParsing}>Cancel</Button>
          <Button onClick={handleImportClick} disabled={isParsing || !recipeText.trim()}>
            {isParsing ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : 'Import Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
