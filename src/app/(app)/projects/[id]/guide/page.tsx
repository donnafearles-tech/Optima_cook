
'use client';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, List, Network, AlertTriangle, Loader2 } from 'lucide-react';
import CpmDiagram from '@/components/projects/cpm-diagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project, Recipe, Task } from '@/lib/types';
import { useCollection, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect, useMemo } from 'react';

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (remainingSeconds > 0 && hours === 0) result += `${remainingSeconds}s`;
  
  return result.trim() || '0s';
}

export default function GuidePage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { firestore, user } = useFirebase();
  const [progress, setProgress] = useState(10);


  const projectRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, 'users', user.uid, 'projects', id);
  }, [firestore, user, id]);

  const { data: project, isLoading: isLoadingProject, error } = useDoc<Project>(projectRef);
  
  const recipesQuery = useMemoFirebase(() => {
      if(!projectRef) return null;
      return collection(projectRef, 'recipes');
  }, [projectRef])
  const { data: recipes, isLoading: isLoadingRecipes } = useCollection<Recipe>(recipesQuery);

  const recipeMap = useMemo(() => {
    if (!recipes) return new Map();
    return new Map(recipes.map(r => [r.id, r.name]));
  }, [recipes]);


  useEffect(() => {
    // Only run the animation if the guide is being generated
    if (project && (!project.cpmResult || !project.cpmResult.tasks || project.cpmResult.tasks.some(t => t.es === undefined))) {
        const timer = setInterval(() => {
            setProgress((prev) => (prev >= 90 ? 10 : prev + 10));
        }, 600);

        return () => {
            clearInterval(timer);
        };
    }
  }, [project]);
  
  const goBackButton = (
    <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
            {project?.name || 'Cargando Proyecto...'}: Tu Guía de Cocina
        </h1>
        </div>
    </div>
  );
  
  if (isLoadingProject || isLoadingRecipes || !user) {
    return (
        <div className="container mx-auto p-4">
             {goBackButton}
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Cargando guía...</p>
            </div>
        </div>
    );
  }
  
  if (error) {
    return (
        <div className="container mx-auto p-4">
             {goBackButton}
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al Cargar</AlertTitle>
              <AlertDescription>
                No se pudo cargar la guía del proyecto. Es posible que no tengas permisos o que haya ocurrido un error de red.
                <div className="mt-4">
                    <Button variant="outline" onClick={() => router.back()}>Volver</Button>
                </div>
              </AlertDescription>
            </Alert>
        </div>
    )
  }

  if (!project) {
    return (
        <div className="container mx-auto p-4">
             {goBackButton}
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Proyecto no encontrado</AlertTitle>
              <AlertDescription>
                El proyecto que buscas no existe.
                <div className="mt-4">
                    <Button variant="outline" onClick={() => router.back()}>Volver</Button>
                </div>
              </AlertDescription>
            </Alert>
        </div>
    )
  }

  // Si el resultado de CPM no está listo, muestra un estado de carga mientras los datos llegan por Firestore.
  if (!project.cpmResult || !project.cpmResult.tasks || project.cpmResult.tasks.some(t => t.es === undefined)) {
    return (
        <div className="container mx-auto p-4">
            {goBackButton}
             <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12">
                <h3 className="text-xl font-semibold mb-4">Generando guía de cocina...</h3>
                <Progress value={progress} className="w-full max-w-md mb-4" />
                <p className="mt-2 text-muted-foreground max-w-md">
                    El cálculo está en progreso. La guía aparecerá aquí automáticamente. Esto puede tardar hasta un minuto dependiendo de la complejidad del proyecto.
                </p>
            </div>
        </div>
    )
  }

  const { totalDuration, tasks } = project.cpmResult;
  const sortedTasks = [...tasks].sort((a, b) => (a.es ?? 0) - (b.es ?? 0));
  
  // Group tasks by start time for step-by-step view
  const taskGroups = sortedTasks.reduce((acc, task) => {
    const startTime = task.es ?? 0;
    if (!acc[startTime]) {
      acc[startTime] = [];
    }
    acc[startTime].push(task);
    return acc;
  }, {} as Record<number, typeof tasks>);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {project.name}: Tu Guía de Cocina
          </h1>
          <p className="text-muted-foreground">La ruta óptima hacia el éxito culinario.</p>
        </div>
      </div>

      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardDescription>Tiempo Total Estimado de Cocina</CardDescription>
            <CardTitle className="text-4xl font-headline text-primary">{formatDuration(totalDuration)}</CardTitle>
          </div>
          <Clock className="h-12 w-12 text-primary/50" />
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="steps">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="steps"><List className="mr-2 h-4 w-4"/>Paso a Paso</TabsTrigger>
            <TabsTrigger value="network"><Network className="mr-2 h-4 w-4"/>Diagrama de Red</TabsTrigger>
        </TabsList>
        <TabsContent value="steps">
            <div className="space-y-6 mt-4">
                {Object.entries(taskGroups).map(([startTime, groupTasks], index) => (
                <Card key={startTime} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                        <CardTitle className="text-lg font-headline flex items-center gap-4">
                            <Badge className="text-sm">Paso {index + 1}</Badge>
                            A los {formatDuration(Number(startTime))}
                        </CardTitle>
                        <CardDescription>Comienza estas tareas ahora. Se pueden hacer en paralelo.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                    {groupTasks.map(task => {
                        const recipeName = task.recipeIds.length > 0 ? recipeMap.get(task.recipeIds[0]) : null;
                        return (
                            <div key={task.id} className="p-3 border rounded-lg flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {recipeName && <Badge variant="secondary" className="bg-green-100 text-green-800">{recipeName}</Badge>}
                                        <p className="font-semibold">{task.name}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-2">Duración: {formatDuration(task.duration)}</p>
                                </div>
                                {task.isCritical && <Badge variant="destructive" className="ml-2 flex-shrink-0">Crítica</Badge>}
                            </div>
                        );
                    })}
                    </CardContent>
                </Card>
                ))}
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-6">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="font-semibold">¡Todo listo! Disfruta tu comida.</p>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="network">
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="font-headline">Diagrama de Red (CPM)</CardTitle>
                    <CardDescription>Visualización del flujo de trabajo. Las tareas críticas están resaltadas.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[400px]">
                    <CpmDiagram tasks={tasks} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
