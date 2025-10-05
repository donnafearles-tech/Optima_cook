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
    
    const criticalFill = '#b85842'; // Rojo/Marrón para la ruta crítica
    const nonCriticalFill = '#5a8a6f'; // Verde para tareas no críticas
    const textColor = '#FFFFFF'; // Texto blanco para contraste

    let graph = `graph LR;\n`; // Cambiado de TD a LR para orientación horizontal

    tasks.forEach(task => {
        const taskId = task.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const taskName = task.name.replace(/"/g, '#quot;');
        
        const nodeBgColor = task.isCritical ? criticalFill : nonCriticalFill;

        graph += `${taskId}("<div style='background-color:${nodeBgColor}; color:${textColor}; padding: 10px; border-radius: 5px; white-space: normal; word-wrap: break-word; text-align: center; font-family: sans-serif; font-size: 12px; line-height: 1.2;'><strong>${taskName}</strong><br>ES: ${task.es} | EF: ${task.ef}<br>LS: ${task.ls} | LF: ${task.lf}<br>Holgura: ${task.float}</div>");\n`;
        
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
            containerRef.current.innerHTML = '<div class="w-full h-full flex justify-center items-center">Cargando diagrama...</div>';
        }
        
        const renderMermaid = async () => {
            try {
                // Ensure a unique ID for each render to avoid Mermaid cache issues
                const uniqueId = `mermaid-graph-${Date.now()}`;
                const { svg } = await mermaid.render(uniqueId, mermaidChart);
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    // Optional: Style the SVG element itself if needed
                    const svgElement = containerRef.current.querySelector('svg');
                    if (svgElement) {
                      svgElement.style.maxWidth = '100%';
                      svgElement.style.height = 'auto';
                    }
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
    <Card className="mt-4 overflow-hidden">
        <CardHeader>
            <CardTitle className="font-headline">Diagrama de Red (CPM)</CardTitle>
            <CardDescription>Visualización del flujo de trabajo. Las tareas críticas están resaltadas en rojo/marrón.</CardDescription>
        </CardHeader>
        <CardContent>
            <div ref={containerRef} className="min-h-[400px] w-full flex justify-center items-center">
                {/* Mermaid will render the graph here */}
            </div>
        </CardContent>
    </Card>
  );
}
