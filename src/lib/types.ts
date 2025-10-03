import { z } from 'zod';

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

// AI Flow Schemas

const AiTaskSchema = z.object({
  name: z.string().describe('The name of the task.'),
  duration: z.number().describe('The estimated duration of the task in seconds.'),
});

export const ParseRecipeInputSchema = z.object({
  recipeText: z.string().describe('The full text of the recipe to parse.'),
});
export type ParseRecipeInput = z.infer<typeof ParseRecipeInputSchema>;

export const ParseRecipeOutputSchema = z.object({
    recipeName: z.string().describe('The name of the recipe.'),
    tasks: z.array(AiTaskSchema).describe('The list of tasks extracted from the recipe, with estimated durations.'),
});
export type ParseRecipeOutput = z.infer<typeof ParseRecipeOutputSchema>;


export const SuggestTaskDependenciesInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  taskList: z
    .array(z.string())
    .describe('A list of task names in the recipe.'),
});
export type SuggestTaskDependenciesInput = z.infer<
  typeof SuggestTaskDependenciesInputSchema
>;

export const SuggestTaskDependenciesOutputSchema = z.record(
  z.string(),
  z.array(z.string())
).describe('A map of task names to a list of suggested predecessor task names.');
export type SuggestTaskDependenciesOutput = z.infer<
  typeof SuggestTaskDependenciesOutputSchema
>;
