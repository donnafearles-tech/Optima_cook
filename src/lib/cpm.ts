import type { Task, CpmResult } from './types';

export function calculateCPM(tasks: Task[]): CpmResult {
  if (tasks.length === 0) {
    return { totalDuration: 0, criticalPath: [], tasks: [] };
  }

  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, { ...t }]));
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

  // Forward pass
  const queue = tasks.filter(t => inDegree[t.id] === 0);
  for (const task of queue) {
    task.es = 0;
    task.ef = task.duration;
    taskMap.set(task.id, task);
  }

  let head = 0;
  while(head < queue.length) {
    const uId = queue[head++].id;
    const u = taskMap.get(uId)!;

    for (const vId of adj[uId] || []) {
        const v = taskMap.get(vId)!;
        v.es = Math.max(v.es ?? 0, u.ef ?? 0);
        v.ef = v.es + v.duration;
        taskMap.set(vId, v);
        
        inDegree[vId]--;
        if (inDegree[vId] === 0) {
            queue.push(v);
        }
    }
  }

  const projectFinishTime = Math.max(...Array.from(taskMap.values()).map(t => t.ef ?? 0));
  
  // Backward pass
  const endTasks = tasks.filter(t => (adj[t.id] || []).length === 0);
  const visited = new Set<string>();
  const backQueue = [...endTasks];
  
  for(const task of Array.from(taskMap.values())) {
      task.lf = projectFinishTime;
      task.ls = task.lf - task.duration;
  }

  for(const task of endTasks) {
    task.lf = projectFinishTime;
    task.ls = task.lf - task.duration;
    taskMap.set(task.id, task);
  }

  const topologicalOrder = queue.map(t => t.id);
  
  for (let i = topologicalOrder.length - 1; i >= 0; i--) {
    const uId = topologicalOrder[i];
    const u = taskMap.get(uId)!;
    
    for (const vId of adj[uId] || []) {
      const v = taskMap.get(vId)!;
      u.lf = Math.min(u.lf ?? projectFinishTime, v.ls ?? projectFinishTime);
      u.ls = u.lf - u.duration;
      taskMap.set(uId, u);
    }
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
