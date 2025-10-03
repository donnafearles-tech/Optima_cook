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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface ImportRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export default function ImportRecipeDialog({ open, onOpenChange, project }: ImportRecipeDialogProps) {
  const [recipeText, setRecipeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { firestore } = useFirebase();

  const handleParse = async (textToParse: string) => {
     if (!textToParse.trim()) {
      toast({
        title: 'No hay texto para analizar',
        description: 'Por favor, pega o sube una receta.',
        variant: 'destructive',
      });
      return;
    }
    setIsParsing(true);
    try {
      const result: ParseRecipeOutput = await parseRecipe({ recipeText: textToParse });
      
      const batch = writeBatch(firestore);
      
      // 1. Create Recipe document
      const recipesCol = collection(firestore, 'recipes');
      const newRecipeRef = doc(recipesCol);
      batch.set(newRecipeRef, {
        name: result.recipeName,
        projectId: project.id
      });
      
      // 2. Create Task documents
      const tasksCol = collection(firestore, 'tasks');
      const taskNameMap = new Map<string, string>();
      
      result.tasks.forEach(t => {
          const taskRef = doc(tasksCol);
          taskNameMap.set(t.name, taskRef.id);
          const { predecessorIds, ...taskData } = t;
          batch.set(taskRef, {
            ...taskData,
            recipeId: newRecipeRef.id,
            projectId: project.id,
            status: 'pending'
          });
      });

      // 3. Update tasks with correct predecessor IDs
      result.tasks.forEach(t => {
        const currentTaskId = taskNameMap.get(t.name);
        if (currentTaskId) {
            const taskRef = doc(tasksCol, currentTaskId);
            const mappedPredIds = t.predecessorIds
                .map(name => taskNameMap.get(name))
                .filter((id): id is string => !!id);
            batch.update(taskRef, { predecessorIds: mappedPredIds });
        }
      });
      
      await batch.commit();

      toast({
        title: '¡Receta Importada!',
        description: `Se importó "${result.recipeName}" y se añadieron ${result.tasks.length} tareas.`,
      });

      onOpenChange(false);
      setRecipeText('');
      setFileName('');

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

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileDataUri = e.target?.result as string;
        try {
            const { text } = await extractTextFromFile({ fileDataUri });
            setRecipeText(text);
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
    handleParse(recipeText);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Importar Receta</DialogTitle>
          <DialogDescription>
            Pega tu receta, o sube un archivo. La IA la analizará para extraer el nombre, las tareas y sus dependencias.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="paste">
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
                />
            </TabsContent>
            <TabsContent value="upload" className="py-4">
                <div className="min-h-[250px] flex flex-col gap-4">
                  <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground mb-2">
                        {fileName ? `Seleccionado: ${fileName}` : "Sube un archivo .txt, .pdf, .xlsx, .docx, .png, o .jpg"}
                      </p>
                      <Button type="button" onClick={() => fileInputRef.current?.click()}>
                          Buscar Archivos
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
                          <Label>Texto Extraído (vista previa)</Label>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isParsing}>Cancelar</Button>
          <Button onClick={handleImportClick} disabled={isParsing || !recipeText.trim()}>
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
