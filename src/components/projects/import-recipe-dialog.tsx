'use client';
import { useState, useRef, useEffect } from 'react';
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
import { parseRecipe, extractTextFromFile, suggestResourceForTask } from '@/app/actions/ai-actions';
import type { ParseRecipeInput, ParseRecipeOutput, Task, UserResource, Recipe, Project } from '@/lib/types';
import { Sparkles, Upload, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';


interface ImportRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  userId: string;
}

function FileUploader({ onFileChange, onJsonFileContent, isParsing, label, description, fileType }: { onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void, onJsonFileContent: (content: string) => void, isParsing: boolean, label: string, description: string, fileType: "recipe" | "manual" }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onJsonFileContent(content);
        };
        reader.readAsText(file);
      } else {
        onFileChange(event);
      }
    } else {
      setFileName('');
    }
  };
  
  return (
    <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 text-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        {fileType === 'recipe' ? <Upload className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
        <div>
           <Label htmlFor={`file-upload-${fileType}`} className="font-semibold text-base">{label}</Label>
           <p className="text-xs text-muted-foreground">{fileName ? `Seleccionado: ${fileName}` : description}</p>
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
          Buscar Archivo
      </Button>
      <Input 
          id={`file-upload-${fileType}`}
          type="file" 
          ref={fileInputRef} 
          className="hidden"
          onChange={handleFileSelect}
          accept=".txt,.pdf,.xlsx,.docx,.png,.jpg,.jpeg,.json"
          disabled={isParsing}
      />
    </div>
  )
}

export default function ImportRecipeDialog({ open, onOpenChange, projectId, userId }: ImportRecipeDialogProps) {
  const [recipeText, setRecipeText] = useState('');
  const [extractedFileText, setExtractedFileText] = useState('');
  const [knowledgeBaseText, setKnowledgeBaseText] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState('paste');
  const { toast } = useToast();
  
  const { firestore } = useFirebase();
  
  const resourcesQuery = useMemoFirebase(() => {
    if (!userId) return null;
    return collection(firestore, 'users', userId, 'resources');
  }, [firestore, userId]);
  const { data: userResources } = useCollection<UserResource>(resourcesQuery);


  const handleJsonImport = async () => {
    setIsParsing(true);
    try {
      const parsedData = JSON.parse(jsonContent);

      const recipesToImport: Recipe[] = parsedData.recipes || [];
      const tasksToImport: Task[] = parsedData.tasks || [];

      if (recipesToImport.length === 0 && tasksToImport.length === 0) {
        toast({ title: 'JSON Vacío', description: 'El archivo JSON no contiene recetas o tareas.', variant: 'destructive'});
        setIsParsing(false);
        return;
      }
      
      const batch = writeBatch(firestore);
      const projectRef = doc(firestore, 'users', userId, 'projects', projectId);
      
      const oldToNewRecipeIdMap = new Map<string, string>();
      const recipesCol = collection(projectRef, 'recipes');
      recipesToImport.forEach(recipe => {
        const newRecipeRef = doc(recipesCol);
        oldToNewRecipeIdMap.set(recipe.id, newRecipeRef.id);
        batch.set(newRecipeRef, { name: recipe.name });
      });
      
      const oldToNewTaskIdMap = new Map<string, string>();
      const tasksCol = collection(projectRef, 'tasks');
      const taskRefs = tasksToImport.map(originalTask => {
        const taskRef = doc(tasksCol);
        oldToNewTaskIdMap.set(originalTask.id, taskRef.id);
        return { originalTask, taskRef };
      });
      
      taskRefs.forEach(({ originalTask, taskRef }) => {
        const newRecipeIds = (originalTask.recipeIds || [])
          .map(oldId => oldToNewRecipeIdMap.get(oldId))
          .filter((id): id is string => !!id);
        
        const newPredecessorIds = (originalTask.predecessorIds || [])
          .map(oldId => oldToNewTaskIdMap.get(oldId))
          .filter((id): id is string => !!id);

        const { id, ...taskData } = originalTask;
        const finalTaskData: Omit<Task, 'id'> = {
          ...taskData,
          recipeIds: newRecipeIds.length > 0 ? newRecipeIds : (recipesToImport.length > 0 ? [oldToNewRecipeIdMap.values().next().value] : []),
          predecessorIds: newPredecessorIds,
        };
        batch.set(taskRef, finalTaskData);
      });

      await batch.commit();

      toast({
        title: '¡Importación JSON Exitosa!',
        description: `Se importaron ${recipesToImport.length} recetas y ${tasksToImport.length} tareas.`,
      });

      onOpenChange(false);
      // Reset all states
      setRecipeText('');
      setExtractedFileText('');
      setKnowledgeBaseText('');
      setJsonContent('');

    } catch (error) {
      console.error('Falló la importación del JSON', error);
      toast({
        title: 'Falló la Importación',
        description: 'No se pudo procesar el archivo JSON. Verifica que el formato sea correcto.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  }


  const handleParse = async () => {
    if (jsonContent) {
      await handleJsonImport();
      return;
    }

    const textToParse = activeTab === 'upload' ? extractedFileText : recipeText;
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
      const parseInput: ParseRecipeInput = { recipeText: textToParse };
      if (knowledgeBaseText) {
        parseInput.knowledgeBaseText = knowledgeBaseText;
      }

      const result: ParseRecipeOutput = await parseRecipe(parseInput);
      
      const batch = writeBatch(firestore);
      const projectRef = doc(firestore, 'users', userId, 'projects', projectId);

      const recipesCol = collection(projectRef, 'recipes');
      const newRecipeRef = doc(recipesCol);
      batch.set(newRecipeRef, {
        name: result.recipeName,
      });
      
      const tasksCol = collection(projectRef, 'tasks');
      const taskNameMap = new Map<string, string>();
      
      const taskRefs = result.tasks.map(originalTask => {
        const taskRef = doc(tasksCol);
        taskNameMap.set(originalTask.name, taskRef.id);
        return { originalTask, taskRef };
      });
      
      const resourceSuggestions = userResources && userResources.length > 0 ? await Promise.all(
        result.tasks.map(t => suggestResourceForTask({ taskName: t.name, userResources }))
      ) : result.tasks.map(() => ({ resourceIds: [] }));


      taskRefs.forEach(({ originalTask, taskRef }, index) => {
        const mappedPredIds = originalTask.predecessorIds
          .map(name => taskNameMap.get(name))
          .filter((id): id is string => !!id);

        const finalTaskData: Omit<Task, 'id'> = {
          name: originalTask.name,
          duration: originalTask.duration,
          isAssemblyStep: originalTask.isAssemblyStep,
          recipeIds: [newRecipeRef.id],
          status: 'pending' as const,
          resourceIds: resourceSuggestions[index]?.resourceIds || [],
          predecessorIds: mappedPredIds
        };
        batch.set(taskRef, finalTaskData);
      });
      
      await batch.commit();

      toast({
        title: '¡Receta Importada!',
        description: `Se importó "${result.recipeName}" y se añadieron ${result.tasks.length} tareas.`,
      });

      // Reset state on success
      onOpenChange(false);
      setRecipeText('');
      setExtractedFileText('');
      setKnowledgeBaseText('');
      setJsonContent('');

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

  useEffect(() => {
    // Prevent accidental navigation when parsing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isParsing) {
            e.preventDefault();
            e.returnValue = 'La importación de la receta está en progreso. ¿Estás seguro de que quieres salir?';
        }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isParsing]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fileType: "recipe" | "manual") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    if(fileType === 'recipe') {
      setExtractedFileText('');
      setJsonContent('');
    }
    if(fileType === 'manual') setKnowledgeBaseText('');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileDataUri = e.target?.result as string;
        try {
            const { text } = await extractTextFromFile({ fileDataUri });
            if (fileType === 'recipe') {
              setExtractedFileText(text);
            } else {
              setKnowledgeBaseText(text);
            }
            toast({
              title: `Archivo de ${fileType === 'recipe' ? 'receta' : 'manual'} procesado`,
              description: "Se ha extraído el texto. Puedes continuar."
            })
        } catch (error) {
            console.error(`Error al extraer texto del archivo de ${fileType}`, error);
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
        toast({
            title: "Error al Leer Archivo",
            description: "Ocurrió un error al leer el archivo.",
            variant: "destructive",
        });
        setIsParsing(false);
    };
    reader.readAsDataURL(file);
  }

  const handleJsonContent = (content: string) => {
    setJsonContent(content);
    setExtractedFileText(`Archivo JSON cargado. Contiene ${content.length} caracteres.`);
    toast({
      title: "Archivo JSON cargado",
      description: "Listo para importar."
    });
  }

  const isImportDisabled = isParsing || (activeTab === 'paste' && !recipeText.trim()) || (activeTab === 'upload' && !extractedFileText.trim() && !jsonContent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Importar Receta con IA o JSON</DialogTitle>
          <DialogDescription>
            Pega tu receta, sube un archivo (texto, PDF, imagen, JSON) o añade un manual para darle contexto a la IA.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <Tabs defaultValue="paste" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="paste">Pegar Receta</TabsTrigger>
                        <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                    </TabsList>
                    <TabsContent value="paste" className="py-4">
                        <Textarea
                            placeholder="Pega el texto de tu receta aquí..."
                            className="min-h-[250px] text-sm"
                            value={recipeText}
                            onChange={(e) => setRecipeText(e.target.value)}
                            disabled={isParsing}
                        />
                    </TabsContent>
                    <TabsContent value="upload" className="py-4">
                        <FileUploader 
                            onFileChange={(e) => handleFileChange(e, 'recipe')}
                            onJsonFileContent={handleJsonContent}
                            isParsing={isParsing}
                            label="Subir Receta o JSON"
                            description="Sube un archivo de receta (.txt, .pdf, .json, etc.)"
                            fileType="recipe"
                        />
                        {extractedFileText && (
                            <div className="relative mt-2">
                                <Label>Texto Extraído (vista previa)</Label>
                                <Textarea readOnly value={extractedFileText} className="mt-1 h-20 text-xs bg-muted" />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
            <div className="space-y-4">
                 <FileUploader 
                    onFileChange={(e) => handleFileChange(e, 'manual')}
                    onJsonFileContent={() => {}} // No-op for manual context
                    isParsing={isParsing}
                    label="Manual de Contexto (Opcional)"
                    description="Sube un manual de cocina para mejorar la IA."
                    fileType="manual"
                />
                {knowledgeBaseText && (
                    <div className="relative mt-2">
                        <Label>Contexto Extraído (vista previa)</Label>
                        <Textarea readOnly value={knowledgeBaseText} className="mt-1 h-32 text-xs bg-muted" />
                    </div>
                )}
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isParsing}>Cancelar</Button>
          <Button onClick={handleParse} disabled={isImportDisabled}>
            {isParsing ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : jsonContent ? 'Importar desde JSON' : 'Importar y Analizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
