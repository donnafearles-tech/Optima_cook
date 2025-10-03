'use client';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, List, GanttChartSquare, AlertTriangle } from 'lucide-react';
import GanttChart from '@/components/projects/gantt-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project } from '@/lib/types';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

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

  const projectRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, 'users', user.uid, 'projects', id);
  }, [firestore, user, id]);

  const { data: project, isLoading, error } = useDoc<Project>(projectRef);
  
  if (isLoading || !user) {
    return <div>Cargando guía...</div>;
  }
  
  if (error) {
    return (
        <div className="container mx-auto p-4">
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

  const goBackButton = (
    <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
            {project.name}: Guía de Cocina
        </h1>
        </div>
    </div>
  );

  if (!project.cpmResult) {
    return (
        <div className="container mx-auto p-4">
            {goBackButton}
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Guía no disponible</AlertTitle>
              <AlertDescription>
                La guía de ruta óptima aún no ha sido generada o no se encontró. Por favor, vuelve a la página del proyecto y haz clic en "Calcular Ruta Óptima".
              </AlertDescription>
            </Alert>
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
            <TabsTrigger value="gantt"><GanttChartSquare className="mr-2 h-4 w-4"/>Diagrama de Gantt</TabsTrigger>
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
                    {groupTasks.map(task => (
                        <div key={task.id} className="p-3 border rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{task.name}</p>
                                <p className="text-sm text-muted-foreground">Duración: {formatDuration(task.duration)}</p>
                            </div>
                            {task.isCritical && <Badge variant="destructive">Crítica</Badge>}
                        </div>
                    ))}
                    </CardContent>
                </Card>
                ))}
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-6">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="font-semibold">¡Todo listo! Disfruta tu comida.</p>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="gantt">
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="font-headline">Cronograma de Cocina</CardTitle>
                    <CardDescription>Visualizando tu horario de cocina. Las tareas críticas están en rojo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GanttChart tasks={tasks} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
