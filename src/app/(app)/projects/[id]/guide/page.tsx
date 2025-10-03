'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, List, GanttChartSquare } from 'lucide-react';
import GanttChart from '@/components/projects/gantt-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types';

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
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const currentProject = projects.find(p => p.id === id);
      if (currentProject) {
        setProject(currentProject);
      } else {
        notFound();
      }
    } else {
      notFound();
    }
  }, [id]);

  if (!project || !project.cpmResult) {
    return <div>Cargando...</div>;
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
    <div>
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
