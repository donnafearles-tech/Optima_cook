export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  duration: number; // in seconds
  recipeId: string;
  predecessorIds: string[];
  status: TaskStatus;
  // CPM properties
  es?: number; // Early Start
  ef?: number; // Early Finish
  ls?: number; // Late Start
  lf?: "number" | number; // Late Finish - Allow number for CPM calculation
  float?: number; // Slack/Float
  isCritical?: boolean;
}

export interface Recipe {
  id:string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // Corresponds to Firebase Auth UID
  recipes: Recipe[];
  tasks: Task[];
  cpmResult?: CpmResult;
}

export interface CpmResult {
  totalDuration: number;
  criticalPath: string[];
  tasks: Task[];
}
