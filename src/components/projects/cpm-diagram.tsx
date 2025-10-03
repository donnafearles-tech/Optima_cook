'use client';
import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface Node {
  id: string;
  level: number;
  task: Task;
}

// Function to calculate node levels
function calculateNodeLevels(tasks: Task[]): Node[] {
  if (!tasks || tasks.length === 0) return [];
  
  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const task of tasks) {
    adj.set(task.id, []);
    inDegree.set(task.id, 0);
  }

  for (const task of tasks) {
    for (const predId of task.predecessorIds) {
      if (adj.has(predId)) {
        adj.get(predId)!.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  tasks.forEach(task => {
    if (inDegree.get(task.id) === 0) {
      queue.push(task.id);
    }
  });

  const levels = new Map<string, number>();
  let level = 0;
  while (queue.length > 0) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const u = queue.shift()!;
      levels.set(u, level);
      for (const v of adj.get(u) || []) {
        inDegree.set(v, (inDegree.get(v) || 0) - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }
    level++;
  }

  return tasks.map(task => ({
    id: task.id,
    level: levels.get(task.id) ?? 0,
    task,
  })).sort((a,b) => a.level - b.level);
}


export default function CpmDiagram({ tasks }: { tasks: Task[] }) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  const nodes = useMemo(() => calculateNodeLevels(tasks), [tasks]);

  useLayoutEffect(() => {
    if (Object.values(nodeRefs.current).every(ref => ref)) {
      const newPositions: Record<string, { x: number; y: number }> = {};
      Object.keys(nodeRefs.current).forEach(id => {
        const el = nodeRefs.current[id];
        if (el) {
          newPositions[id] = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
        }
      });
      setPositions(newPositions);
    }
  }, [nodes]);

  if (!tasks || tasks.length === 0 || tasks.some(t => t.es === undefined || t.ef === undefined)) {
    return (
        <div className="text-center p-8 text-muted-foreground">
            No hay datos de cronograma para mostrar. Por favor, calcula la Ruta Óptima primero.
        </div>
    );
  }
  
  const levels = Array.from(new Set(nodes.map(n => n.level)));

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto p-4 min-h-[500px]">
      <div className="flex gap-16 items-start">
        {levels.map(level => (
          <div key={level} className="flex flex-col gap-8 items-center">
            {nodes.filter(n => n.level === level).map(node => (
              <div key={node.id} ref={el => (nodeRefs.current[node.id] = el)}>
                <Card 
                  className={cn("w-48 shadow-lg", 
                    node.task.isCritical 
                    ? "bg-[#FF6600] text-white" 
                    : "bg-card"
                  )}
                >
                  <CardContent className="p-3 text-center">
                    <p className="font-bold text-sm truncate">{node.task.name}</p>
                    <Separator className={cn("my-2", node.task.isCritical ? "bg-white/30" : "bg-border")} />
                    <div className="grid grid-cols-2 text-xs gap-x-2 gap-y-1 text-left">
                        <div className="font-semibold">ES: {node.task.es}</div>
                        <div className="font-semibold">EF: {node.task.ef}</div>
                        <div className="font-semibold">LS: {node.task.ls}</div>
                        <div className="font-semibold">LF: {node.task.lf}</div>
                    </div>
                     <Separator className={cn("my-2", node.task.isCritical ? "bg-white/30" : "bg-border")} />
                     <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <div className="font-semibold tracking-wider">DUR</div>
                            <div>{node.task.duration}s</div>
                        </div>
                        <div>
                            <div className="font-semibold tracking-wider">HOLGURA</div>
                            <div>{node.task.float}</div>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ))}
      </div>

      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#166534" />
          </marker>
        </defs>
        {nodes.map(node =>
          node.task.predecessorIds.map(predId => {
            const startPos = positions[predId];
            const endPos = positions[node.id];
            if (!startPos || !endPos) return null;

            return (
              <path
                key={`${predId}-${node.id}`}
                d={`M ${startPos.x},${startPos.y} C ${startPos.x + 80},${startPos.y} ${endPos.x - 80},${endPos.y} ${endPos.x},${endPos.y}`}
                stroke="#166534"
                strokeWidth="2.5"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
