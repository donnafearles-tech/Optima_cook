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
import { suggestResourceForTask } from '@/ai/flows/suggest-resource-for-task';
import type { ParseRecipeOutput, UserResource } from '@/lib/types';
import { Sparkles, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface ImportRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  userId: string;
}

export default function ImportRecipeDialog({ open, onOpenChange, projectId, userId }: ImportRecipeDialogProps) {
  const [recipeText, setRecipeText] = useState('');
  const [extractedFileText, setExtractedFileText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('paste');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { firestore } = useFirebase();

  const userRef = useMemoFirebase(() => doc(firestore, 'users', userId), [firestore, userId]);
  const resourcesQuery = useMemoFirebase(() => collection(userRef, 'resources'), [userRef]);
  const { data: userResources } = useCollection<UserResource>(resourcesQuery);

  const handleParse = async (textToParse: string) => {
     if (!textToParse.trim()) {
      toast({
        title: 'Faltan datos',
        description: 'Por favor, pega o sube una receta.',
        variant: 'destructive',
      });
      return;
    }
    setIsParsing(true);
    try {
      // 1. Parse recipe to get tasks
      const result: ParseRecipeOutput = await parseRecipe({ recipeText: textToParse });
      
      const batch = writeBatch(firestore);
      const projectRef = doc(firestore, 'users', userId, 'projects', projectId);

      // 2. Create Recipe document
      const recipesCol = collection(projectRef, 'recipes');
      const newRecipeRef = doc(recipesCol);
      batch.set(newRecipeRef, {
        name: result.recipeName,
      });
      
      const tasksCol = collection(projectRef, 'tasks');
      const taskNameMap = new Map<string, string>();
      const createdTasks: { tempId: string; finalId: string; originalTask: typeof result.tasks[0] }[] = [];

      // 3. First pass: Create tasks and get their future IDs
      for (const t of result.tasks) {
          const taskRef = doc(tasksCol);
          taskNameMap.set(t.name, taskRef.id);
          createdTasks.push({ tempId: t.name, finalId: taskRef.id, originalTask: t });
      }

      // 4. Proactively suggest resources for all tasks in parallel
      const resourceSuggestionPromises = createdTasks.map(async ({ finalId, originalTask }) => {
        let resourceIds: string[] = [];
        if (userResources && userResources.length > 0) {
          try {
            const resourceSuggestion = await suggestResourceForTask({
              taskName: originalTask.name,
              userResources: userResources,
            });
            resourceIds = resourceSuggestion.resourceIds;
          } catch (e) {
            console.warn(`AI resource suggestion failed for task "${originalTask.name}":`, e);
          }
        }
        return { finalId, originalTask, resourceIds };
      });

      const tasksWithResources = await Promise.all(resourceSuggestionPromises);


      // 5. Second pass: Set full task data in the batch
      for (const { finalId, originalTask, resourceIds } of tasksWithResources) {
        const taskRef = doc(tasksCol, finalId);
        const mappedPredIds = originalTask.predecessorIds
          .map(name => taskNameMap.get(name))
          .filter((id): id is string => !!id);

        const finalTaskData = {
          name: originalTask.name,
          duration: originalTask.duration,
          isAssemblyStep: originalTask.isAssemblyStep,
          recipeId: newRecipeRef.id,
          status: 'pending' as const,
          resourceIds: resourceIds,
          predecessorIds: mappedPredIds
        };
        batch.set(taskRef, finalTaskData);
      }
      
      await batch.commit();

      toast({
        title: '¡Receta Importada!',
        description: `Se importó "${result.recipeName}" y se añadieron ${result.tasks.length} tareas.`,
      });

      onOpenChange(false);
      setRecipeText('');
      setFileName('');
      setExtractedFileText('');

    } catch (error) {
      console.error('Falló el análisis de la receta', error);
      toast({
        title: 'Falló la Importación',
        description: 'No se pudo analizar la receta. Por favor, revisa el formato o inténtalo de nuevo.',
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
    setExtractedFileText('');

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileDataUri = e.target?.result as string;
        try {
            const { text } = await extractTextFromFile({ fileDataUri });
            setExtractedFileText(text);
            toast({
              title: "Archivo procesado",
              description: "Se ha extraído el texto. Revísalo y haz clic en Importar."
            })
        } catch (error) {
            console.error("Error al extraer texto del archivo", error);
            toast({
                title: "Error al Leer Archivo",
                description: "No se pudo extraer el texto del archivo subido.",
                variant: "destructive",
            });
        } finally {
            setIsParsing(false);
        }
    };
    reader.onerror = () => {
        console.error("Error de FileReader");
        toast({
            title: "Error al Leer Archivo",
            description: "Ocurrió un error al leer el archivo.",
            variant: "destructive",
        });
        setIsParsing(false);
    };
    reader.readAsDataURL(file);
  }

  const handleImportClick = () => {
    const textToParse = activeTab === 'upload' ? extractedFileText : recipeText;
    handleParse(textToParse);
  }

  const isImportDisabled = isParsing || (activeTab === 'paste' && !recipeText.trim()) || (activeTab === 'upload' && !extractedFileText.trim());


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Importar Receta</DialogTitle>
          <DialogDescription>
            Pega tu receta o sube un archivo. La IA la analizará para extraer tareas y asignar recursos automáticamente.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="paste" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Pegar Texto</TabsTrigger>
                <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="py-4">
                <Textarea
                    placeholder="Pega tu receta aquí..."
                    className="min-h-[250px] text-sm"
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                    disabled={isParsing}
                />
            </TabsContent>
            <TabsContent value="upload" className="py-4">
                <div className="min-h-[250px] flex flex-col gap-4">
                  <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground mb-2">
                        {fileName ? `Seleccionado: ${fileName}` : "Sube un archivo .txt, .pdf, .xlsx, .docx, .png, o .jpg"}
                      </p>
                      <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                          Buscar Archivos
                      </Button>
                      <Input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".txt,.pdf,.xlsx,.docx,.png,.jpg,.jpeg"
                          disabled={isParsing}
                      />
                  </div>
                  {extractedFileText && (
                      <div className="relative">
                          <Label>Texto Extraído (vista previa)</Label>
                          <Textarea
                              readOnly
                              value={extractedFileText}
                              className="mt-1 h-32 text-xs bg-muted"
                          />
                      </div>
                  )}
                </div>
            </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isParsing}>Cancelar</Button>
          <Button onClick={handleImportClick} disabled={isImportDisabled}>
            {isParsing ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : 'Importar Receta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
