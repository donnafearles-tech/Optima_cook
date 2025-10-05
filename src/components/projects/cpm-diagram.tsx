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
        useMaxWidth: false, // Allow diagram to grow
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
    
    // Define CSS classes for Mermaid to use. This is more robust than inline styles.
    let graph = `graph LR;\n`;
    graph += `    classDef critical fill:#b85842,stroke:#000,color:#fff;\n`;
    graph += `    classDef nonCritical fill:#5a8a6f,stroke:#000,color:#fff;\n`;

    tasks.forEach(task => {
        const taskId = task.id.replace(/[^a-zA-Z0-9_]/g, '_');
        // Sanitize name for HTML display. Using quotes and letting Mermaid handle it.
        const taskName = task.name.replace(/"/g, '#quot;');
        
        // Use the div for multiline text, Mermaid will handle wrapping.
        const nodeLabel = `"<div style='padding: 10px; white-space: normal; word-wrap: break-word; text-align: center; font-family: sans-serif; font-size: 12px; line-height: 1.2;'><strong>${taskName}</strong><br>ES: ${task.es} | EF: ${task.ef}<br>LS: ${task.ls} | LF: ${task.lf}<br>Holgura: ${task.float}</div>"`;
        
        graph += `    ${taskId}${nodeLabel};\n`;
        
        // Apply the class to the node
        graph += `    class ${taskId} ${task.isCritical ? 'critical' : 'nonCritical'};\n`;

        if (task.predecessorIds && task.predecessorIds.length > 0) {
            task.predecessorIds.forEach(predId => {
                const predecessorTaskId = predId.replace(/[^a-zA-Z0-9_]/g, '_');
                graph += `    ${predecessorTaskId} --> ${taskId};\n`;
            });
        }
    });

    return graph;
  }, [tasks]);

  useEffect(() => {
    if (mermaidChart && containerRef.current) {
        const currentContainer = containerRef.current;
        currentContainer.innerHTML = '<div class="w-full h-full flex justify-center items-center text-muted-foreground">Cargando diagrama...</div>';
        
        const renderMermaid = async () => {
            try {
                // Ensure a unique ID for each render to avoid Mermaid cache issues
                const uniqueId = `mermaid-graph-${Date.now()}`;
                const { svg } = await mermaid.render(uniqueId, mermaidChart);
                 if (currentContainer) {
                    currentContainer.innerHTML = svg;
                    // Make SVG take up space, which allows the overflow container to scroll
                    const svgElement = currentContainer.querySelector('svg');
                    if (svgElement) {
                      svgElement.style.minWidth = '800px'; // Set a minimum width to encourage scrolling
                      svgElement.style.maxWidth = '2000px'; // Allow it to grow
                    }
                }
            } catch (error) {
                console.error("Error rendering Mermaid chart:", error);
                 if (currentContainer) {
                    currentContainer.innerHTML = `<div class="text-destructive p-4">Error al renderizar el diagrama. Revisa la consola.</div>`;
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
            <CardDescription>Visualización del flujo de trabajo. Las tareas críticas están resaltadas en rojo/marrón. Desliza para ver el diagrama completo.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* This outer container enables scrolling */}
            <div className="w-full overflow-auto p-4 bg-muted/20 rounded-lg">
                <div ref={containerRef} className="min-h-[400px] min-w-[800px] flex justify-center items-center">
                    {/* Mermaid will render the graph here */}
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
