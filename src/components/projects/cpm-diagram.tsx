'use client';
import { useMemo, useEffect, useRef } from 'react';
import type { Task } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    },
});

export default function CpmDiagram({ tasks }: { tasks: Task[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mermaidChart = useMemo(() => {
    if (!tasks || tasks.length === 0 || tasks.some(t => t.es === undefined)) {
      return '';
    }
    
    const criticalFill = '#E63946'; // Red
    const nonCriticalFill = '#457B9D'; // Blue
    const textColor = '#FFFFFF';

    let graph = `graph TD;\n`;

    tasks.forEach(task => {
        const taskId = task.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const taskName = task.name.replace(/"/g, '#quot;');
        
        const nodeBgColor = task.isCritical ? criticalFill : nonCriticalFill;

        // Use HTML labels for full control over styling and text wrapping
        graph += `${taskId}("<div style='background-color:${nodeBgColor}; color:${textColor}; padding: 10px; border-radius: 5px; white-space: normal; word-wrap: break-word; text-align: center;'><strong>${taskName}</strong><br>ES: ${task.es} | EF: ${task.ef}<br>LS: ${task.ls} | LF: ${task.lf}<br>Holgura: ${task.float}</div>");\n`;
        
        if (task.predecessorIds && task.predecessorIds.length > 0) {
            task.predecessorIds.forEach(predId => {
                const predecessorTaskId = predId.replace(/[^a-zA-Z0-9_]/g, '_');
                graph += `${predecessorTaskId} --> ${taskId};\n`;
            });
        }
    });

    return graph;
  }, [tasks]);

  useEffect(() => {
    if (mermaidChart && containerRef.current) {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        
        const renderMermaid = async () => {
            try {
                const { svg } = await mermaid.render('mermaid-graph-svg', mermaidChart);
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
            } catch (error) {
                console.error("Error rendering Mermaid chart:", error);
                 if (containerRef.current) {
                    containerRef.current.innerHTML = `<p class="text-destructive">Error al renderizar el diagrama.</p>`;
                }
            }
        };
        renderMermaid();
    }
  }, [mermaidChart]);

  if (!tasks || tasks.length === 0 || tasks.some(t => t.es === undefined)) {
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="font-headline">Diagrama de Red (CPM)</CardTitle>
                <CardDescription>Visualización del flujo de trabajo.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Datos Incompletos</AlertTitle>
                    <AlertDescription>
                        No hay datos de cronograma para mostrar. Por favor, calcula la Ruta Óptima primero.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mt-4">
        <CardHeader>
            <CardTitle className="font-headline">Diagrama de Red (CPM)</CardTitle>
            <CardDescription>Visualización del flujo de trabajo. Las tareas en rojo indican la ruta crítica.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] overflow-auto">
            <div ref={containerRef} className="mermaid-container w-full h-full flex justify-center items-center">
                {/* Mermaid will render the graph here */}
            </div>
        </CardContent>
    </Card>
  );
}
