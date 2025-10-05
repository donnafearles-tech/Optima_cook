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
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
    },
    fontFamily: '"Open Sans", sans-serif',
    fontWeight: 'bold',
});

export default function CpmDiagram({ tasks }: { tasks: Task[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mermaidChart = useMemo(() => {
    if (!tasks || tasks.length === 0 || tasks.some(t => t.es === undefined)) {
      return '';
    }
    
    let graph = `graph LR;\n`;
    graph += `    classDef critical fill:#F37F58,stroke:#000,color:#000;\n`;
    graph += `    classDef nonCritical fill:#D2EBCD,stroke:#000,color:#000;\n`;

    tasks.forEach(task => {
        const taskId = task.id.replace(/[^a-zA-Z0-9_]/g, '_');
        // Escapamos comillas y envolvemos el texto en un div con estilo para el ajuste de línea
        const taskName = task.name.replace(/"/g, '#quot;');
        
        const nodeLabel = `"<div style='padding: 5px; word-wrap: break-word;'>${taskName}<br>ES: ${task.es} | EF: ${task.ef}<br>LS: ${task.ls} | LF: ${task.lf}<br>Holgura: ${task.float}</div>"`;
        
        graph += `    ${taskId}[${nodeLabel}];\n`;
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
                const uniqueId = `mermaid-graph-${Date.now()}`;
                const { svg } = await mermaid.render(uniqueId, mermaidChart);
                 if (currentContainer) {
                    currentContainer.innerHTML = svg;
                    const svgElement = currentContainer.querySelector('svg');
                    if (svgElement) {
                      svgElement.style.minWidth = '800px';
                      svgElement.style.maxWidth = '2000px';
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
      <div className="overflow-auto border rounded-lg">
        <div ref={containerRef} className="min-w-[800px] min-h-[400px]" />
      </div>
  );
}
