import type { Task, CpmResult } from './types';

export function calculateCPM(tasks: Task[]): CpmResult {
  if (tasks.length === 0) {
    return { totalDuration: 0, criticalPath: [], tasks: [] };
  }

  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, { ...t, es: 0, ef: 0, ls: 0, lf: 0, float: 0, isCritical: false }]));
  const adj: Record<string, string[]> = {};
  const revAdj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  for (const task of tasks) {
    adj[task.id] = [];
    revAdj[task.id] = [];
    inDegree[task.id] = 0;
  }

  for (const task of tasks) {
    for (const predId of task.predecessorIds) {
      if (adj[predId]) {
        adj[predId].push(task.id);
        if (revAdj[task.id]) {
            revAdj[task.id].push(predId);
        }
        inDegree[task.id]++;
      }
    }
  }

  // Forward pass using Kahn's algorithm for topological sort
  const queue: string[] = [];
  for (const task of tasks) {
      if (inDegree[task.id] === 0) {
          queue.push(task.id);
      }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
      const uId = queue.shift()!;
      topologicalOrder.push(uId);
      const u = taskMap.get(uId)!;

      u.ef = (u.es ?? 0) + u.duration;
      taskMap.set(uId, u);

      for (const vId of adj[uId] || []) {
          const v = taskMap.get(vId)!;
          v.es = Math.max(v.es ?? 0, u.ef ?? 0);
          taskMap.set(vId, v);
          inDegree[vId]--;
          if (inDegree[vId] === 0) {
              queue.push(vId);
          }
      }
  }

  if (topologicalOrder.length !== tasks.length) {
    throw new Error("El proyecto contiene un ciclo de dependencias y no se puede calcular la ruta crítica.");
  }


  const projectFinishTime = Math.max(...Array.from(taskMap.values()).map(t => t.ef ?? 0));
  
  // Backward pass
  for(const task of Array.from(taskMap.values())) {
      task.lf = projectFinishTime;
      task.ls = task.lf - task.duration;
  }

  for (let i = topologicalOrder.length - 1; i >= 0; i--) {
    const uId = topologicalOrder[i];
    const u = taskMap.get(uId)!;
    
    if ((adj[uId] || []).length === 0) { // It's a leaf node in the graph
        u.lf = projectFinishTime;
    } else {
        const successorLfs = (adj[uId] || []).map(vId => taskMap.get(vId)!.ls ?? projectFinishTime);
        u.lf = Math.min(...successorLfs);
    }
    u.ls = u.lf - u.duration;
    taskMap.set(uId, u);
  }

  // Calculate float and critical path
  const criticalPath: string[] = [];
  const updatedTasks = Array.from(taskMap.values());

  for (const task of updatedTasks) {
    task.float = (task.ls ?? 0) - (task.es ?? 0);
    // Allow for small floating point inaccuracies
    task.isCritical = task.float < 1e-6;
    if (task.isCritical) {
      criticalPath.push(task.id);
    }
  }

  return {
    totalDuration: projectFinishTime,
    criticalPath,
    tasks: updatedTasks,
  };
}
