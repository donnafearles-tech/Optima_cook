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
    themeVariables: {
        primaryColor: 'hsl(11 87% 70%)',
        primaryTextColor: '#fff',
        primaryBorderColor: 'hsl(11 87% 60%)',
        lineColor: 'hsl(11 87% 70%)',
        textColor: '#333',
        mainBkg: 'hsl(39 33% 97%)',
        // --- Custom class colors ---
        // Critical path
        'c-node-crit-fill': 'hsl(24, 40%, 30%)', // Marrón oscuro
        'c-node-crit-stroke': 'hsl(24, 40%, 20%)',
        'c-node-crit-text': '#fff',
        // Non-critical path
        'c-node-norm-fill': 'hsl(145, 50%, 40%)', // Verde oscuro
        'cnode-norm-stroke': 'hsl(145, 50%, 30%)',
        'c-node-norm-text': '#fff',
    },
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

    let graph = `graph TD;\n`;
    
    // Define classes for node styling
    graph += 'classDef critical fill:hsl(24, 40%, 30%),stroke:hsl(24, 40%, 20%),color:#fff;\n';
    graph += 'classDef noncritical fill:hsl(145, 50%, 40%),stroke:hsl(145, 50%, 30%),color:#fff;\n';

    tasks.forEach(task => {
        // Sanitize task name for Mermaid ID
        const taskId = task.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const taskName = task.name.replace(/"/g, '#quot;');
        
        // Define the node with its text content
        graph += `${taskId}("<div style='padding: 5px; white-space: normal; break-word: break-all; text-align: center;'>${taskName}<br>ES: ${task.es} | EF: ${task.ef}<br>LS: ${task.ls} | LF: ${task.lf}<br>Holgura: ${task.float}</div>");\n`;
        
        // Apply class based on isCritical
        graph += `class ${taskId} ${task.isCritical ? 'critical' : 'noncritical'};\n`;

        // Define dependencies (links)
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
        // Clear previous render
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        
        const renderMermaid = async () => {
            try {
                const { svg } = await mermaid.render('mermaid-graph', mermaidChart);
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
            } catch (error) {
                console.error("Error rendering Mermaid chart:", error);
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
            <CardDescription>Visualización del flujo de trabajo. Los nodos marrones indican la ruta crítica.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] overflow-auto">
            <div ref={containerRef} className="mermaid-container w-full h-full flex justify-center items-center">
                {/* Mermaid will render the graph here */}
                <div id="mermaid-graph-container" className="w-full h-full"></div>
            </div>
        </CardContent>
    </Card>
  );
}
