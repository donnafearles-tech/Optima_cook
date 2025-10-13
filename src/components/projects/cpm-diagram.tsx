
'use client';
import React, { useMemo } from 'react';
import type { Task } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Combine } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 140; // Increased height from 120 to 140
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 40;

type PositionedTask = Task & { x: number; y: number; level: number };

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (remainingSeconds > 0 && hours === 0 && minutes === 0) result += `${remainingSeconds}s`;
  if (minutes > 0 && remainingSeconds > 0) result += `${remainingSeconds}s`

  return result.trim() || '0s';
}


const CpmDiagram = ({ tasks, recipeMap, elapsedTime = 0 }: { tasks: Task[], recipeMap: Map<string, string>, elapsedTime?: number }) => {
  const { toast } = useToast();

  const handleConsolidatedClick = (node: PositionedTask, recipeNames: string[]) => {
    toast({
      title: `Detalles de: ${node.name}`,
      description: (
        <div>
          <p className="font-semibold">Esta tarea unifica los siguientes pasos de las recetas:</p>
          <ul className="list-disc list-inside mt-2">
            {recipeNames.map(name => <li key={name}>{name}</li>)}
          </ul>
        </div>
      ),
    });
  };

  const { nodes, edges, width, height } = useMemo(() => {
    if (!tasks || tasks.length === 0 || tasks.some(t => t.es === undefined)) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    const taskMap = new Map<string, Task>(tasks.map(t => [t.id, { ...t }]));
    const levels = new Map<string, number>();

    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) {
        return levels.get(taskId)!;
      }

      const task = taskMap.get(taskId)!;
      if (!task.predecessorIds || task.predecessorIds.length === 0) {
        levels.set(taskId, 0);
        return 0;
      }

      const maxPredLevel = Math.max(
        ...task.predecessorIds.map(predId => taskMap.has(predId) ? calculateLevel(predId) : -1)
      );
      
      const level = maxPredLevel + 1;
      levels.set(taskId, level);
      return level;
    };

    tasks.forEach(task => calculateLevel(task.id));

    const tasksByLevel: { [key: number]: Task[] } = {};
    tasks.forEach(task => {
      const level = levels.get(task.id)!;
      if (!tasksByLevel[level]) {
        tasksByLevel[level] = [];
      }
      tasksByLevel[level].push(task);
    });

    const positionedNodes: PositionedTask[] = [];
    let maxLevel = 0;
    let maxTasksInLevel = 0;

    Object.keys(tasksByLevel).forEach(levelStr => {
      const level = parseInt(levelStr, 10);
      maxLevel = Math.max(maxLevel, level);
      const levelTasks = tasksByLevel[level];
      maxTasksInLevel = Math.max(maxTasksInLevel, levelTasks.length);

      levelTasks.forEach((task, index) => {
        positionedNodes.push({
          ...task,
          x: level * (NODE_WIDTH + HORIZONTAL_SPACING),
          y: index * (NODE_HEIGHT + VERTICAL_SPACING),
          level: level,
        });
      });
    });

    const edges = [];
    for (const task of positionedNodes) {
      for (const predId of task.predecessorIds) {
        const predecessorNode = positionedNodes.find(n => n.id === predId);
        if (predecessorNode) {
          edges.push({
            id: `${predId}-${task.id}`,
            sourceX: predecessorNode.x + NODE_WIDTH,
            sourceY: predecessorNode.y + NODE_HEIGHT / 2,
            targetX: task.x,
            targetY: task.y + NODE_HEIGHT / 2,
            isCritical: task.isCritical && predecessorNode.isCritical,
          });
        }
      }
    }

    const diagramWidth = (maxLevel + 1) * (NODE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;
    const diagramHeight = maxTasksInLevel * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;

    return { nodes: positionedNodes, edges, width: diagramWidth, height: diagramHeight };
  }, [tasks]);

  if (!nodes.length) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Datos Incompletos</AlertTitle>
        <AlertDescription>
          No hay datos de cronograma para mostrar. Por favor, calcula la Ruta Óptima primero.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
        <div className="overflow-auto border rounded-lg p-4 bg-background">
        <svg width={width} height={height} style={{ minWidth: '100%' }}>
            <defs>
            <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
            >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
            </marker>
            <marker
                id="arrow-critical"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
            >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
            </marker>
            </defs>
            
            {edges.map(edge => {
            const midX = edge.sourceX + HORIZONTAL_SPACING / 2;
            const isCritical = edge.isCritical;
            return (
                <g key={edge.id}>
                    <path
                        d={`M ${edge.sourceX} ${edge.sourceY} L ${midX} ${edge.sourceY} L ${midX} ${edge.targetY} L ${edge.targetX} ${edge.targetY}`}
                        stroke={isCritical ? "hsl(var(--primary))" : "#9ca3af"}
                        strokeWidth="2"
                        fill="none"
                        markerEnd={isCritical ? "url(#arrow-critical)" : "url(#arrow)"}
                    />
                </g>
            )
            })}

            {nodes.map(node => {
            const recipeNames = (node.recipeIds || []).map(rId => recipeMap.get(rId)).filter(Boolean) as string[];
            const isTaskActive = elapsedTime >= (node.es ?? 0) && elapsedTime < (node.ef ?? 0);
            const isTaskCompleted = elapsedTime >= (node.ef ?? 0);
            const timeInTask = Math.max(0, elapsedTime - (node.es ?? 0));
            const remainingTime = Math.max(0, node.duration - timeInTask);

            let nodeFill = 'hsl(var(--card))';
            let nodeStroke = 'hsl(var(--border))';
            let titleColorClass = 'text-card-foreground';

            if (isTaskCompleted) {
                nodeFill = 'hsl(var(--secondary))';
                titleColorClass = 'text-muted-foreground';
            } else if (isTaskActive) {
                nodeFill = 'hsl(var(--primary) / 0.1)';
                nodeStroke = 'hsl(var(--primary))';
                titleColorClass = 'text-primary';
            }
            
            if (node.isCritical) {
              if (isTaskActive) {
                  nodeFill = 'hsl(var(--primary) / 0.1)';
                  titleColorClass = 'text-primary';
              } else if (!isTaskCompleted) {
                  nodeFill = 'hsl(var(--primary) / 0.8)';
                  titleColorClass = 'text-primary-foreground';
              }
              nodeStroke = 'hsl(var(--primary))';
            }


            return (
            <Tooltip key={node.id}>
                <TooltipTrigger asChild>
                    <g transform={`translate(${node.x}, ${node.y})`}>
                        <rect
                        width={NODE_WIDTH}
                        height={NODE_HEIGHT}
                        rx="8"
                        fill={nodeFill}
                        stroke={nodeStroke}
                        strokeWidth="2"
                        />
                        <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
                            <div className="p-2 flex flex-col h-full text-xs">
                                <div className={`font-bold truncate ${titleColorClass}`}>{node.name}</div>
                                
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {node.isConsolidated && (
                                    <Badge 
                                        variant={isTaskActive ? 'default' : 'secondary'} 
                                        className="w-fit bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                                        onClick={() => handleConsolidatedClick(node, recipeNames)}
                                    >
                                        <Combine className="mr-1 h-3 w-3" />
                                        Unificada
                                    </Badge>
                                )}
                                {recipeNames.map(name => (
                                    <Badge key={name} variant={isTaskActive ? 'default' : 'secondary'} className="w-fit">{name}</Badge>
                                ))}
                                </div>

                                <div className="flex-grow"/>
                                
                                {isTaskActive ? (
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground">Tiempo Restante</div>
                                    <div className="text-2xl font-bold font-mono text-primary">{formatDuration(remainingTime)}</div>
                                </div>
                                ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-x-2 text-muted-foreground">
                                        <span>ES: {node.es}</span>
                                        <span>EF: {node.ef}</span>
                                        <span>LS: {node.ls}</span>
                                        <span>LF: {node.lf}</span>
                                    </div>
                                    <div className="text-muted-foreground">Holgura: {node.float}</div>
                                </>
                                )}
                            </div>
                        </foreignObject>
                    </g>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{node.name}</p>
                </TooltipContent>
            </Tooltip>
            )})}
        </svg>
        </div>
    </TooltipProvider>
  );
};

export default CpmDiagram;
