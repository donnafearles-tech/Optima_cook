'use client';
import React, { useMemo } from 'react';
import type { Task } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 40;

type PositionedTask = Task & { x: number; y: number; level: number };

const CpmDiagram = ({ tasks, recipeMap }: { tasks: Task[], recipeMap: Map<string, string> }) => {
  const { nodes, edges, width, height } = useMemo(() => {
    if (!tasks || tasks.length === 0 || tasks.some(t => t.es === undefined)) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
    const levels = new Map<string, number>();

    // Calculate levels (topological sort)
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

    // Group tasks by level
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
          const recipeId = predecessorNode.recipeIds?.[0];
          const recipeName = recipeId ? recipeMap.get(recipeId) : null;
          edges.push({
            id: `${predId}-${task.id}`,
            sourceX: predecessorNode.x + NODE_WIDTH,
            sourceY: predecessorNode.y + NODE_HEIGHT / 2,
            targetX: task.x,
            targetY: task.y + NODE_HEIGHT / 2,
            isCritical: task.isCritical && predecessorNode.isCritical,
            label: recipeName,
          });
        }
      }
    }

    const diagramWidth = (maxLevel + 1) * (NODE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;
    const diagramHeight = maxTasksInLevel * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;

    return { nodes: positionedNodes, edges, width: diagramWidth, height: diagramHeight };
  }, [tasks, recipeMap]);

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
        
        {/* Render Edges */}
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
                 {edge.label && <text
                    x={edge.sourceX + 10}
                    y={edge.sourceY - 5}
                    fill={isCritical ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="start"
                  >
                    {edge.label}
                  </text>}
            </g>
          )
        })}

        {/* Render Nodes */}
        {nodes.map(node => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx="8"
              fill={node.isCritical ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
              stroke={node.isCritical ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
              strokeWidth="2"
            />
            <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
                 <div className={`p-2 flex flex-col h-full text-xs ${node.isCritical ? 'text-primary-foreground' : 'text-card-foreground'}`}>
                    <div className="font-bold truncate">{node.name}</div>
                    <div className="flex-grow"/>
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>ES: {node.es}</span>
                        <span>EF: {node.ef}</span>
                        <span>LS: {node.ls}</span>
                        <span>LF: {node.lf}</span>
                    </div>
                    <div>Holgura: {node.float}</div>
                 </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default CpmDiagram;
