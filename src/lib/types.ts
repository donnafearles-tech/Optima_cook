import {z} from 'zod';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  duration: number; // en segundos
  recipeId: string;
  predecessorIds: string[];
  status: TaskStatus;
  // Propiedades CPM
  es?: number; // Early Start
  ef?: number; // Early Finish
  ls?: number; // Late Start
  lf?: number; // Late Finish
  float?: number; // Holgura
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
  ownerId: string; // Corresponde al UID de Firebase Auth
  recipes: Recipe[];
  tasks: Task[];
  cpmResult?: CpmResult;
}

export interface CpmResult {
  totalDuration: number;
  criticalPath: string[];
  tasks: Task[];
}


const AiTaskSchema = z.object({
  name: z.string().describe('El nombre de la tarea.'),
  duration: z.number().describe('La duración estimada de la tarea en segundos.'),
});

export const ParseRecipeInputSchema = z.object({
  recipeText: z.string().describe('El texto completo de la receta para analizar.'),
  ingredients: z.array(z.string()).optional().describe('Lista de ingredientes para deducir el ensamblaje.'),
});
export type ParseRecipeInput = z.infer<typeof ParseRecipeInputSchema>;

export const ParseRecipeOutputSchema = z.object({
    recipeName: z.string().describe('El nombre de la receta.'),
    tasks: z.array(AiTaskSchema).describe('La lista de tareas extraídas de la receta, con duraciones estimadas.'),
    dependencies: z.record(z.string(), z.array(z.string())).optional().describe('Un mapa de nombres de tareas a una lista de nombres de tareas predecesoras sugeridas.'),
});
export type ParseRecipeOutput = z
  .infer<typeof ParseRecipeOutputSchema>;


export const SuggestTaskDependenciesInputSchema = z.object({
  recipeName: z.string().describe('El nombre de la receta.'),
  taskList: z
    .array(z.string())
    .describe('Una lista de nombres de tareas en la receta.'),
});
export type SuggestTaskDependenciesInput = z.infer<
  typeof SuggestTaskDependenciesInputSchema
>;

export const SuggestTaskDependenciesOutputSchema = z.record(
  z.string(),
  z.array(z.string())
).describe('Un mapa de nombres de tareas a una lista de nombres de tareas predecesoras sugeridas.');
export type SuggestTaskDependenciesOutput = z.infer<
  typeof SuggestTaskDependenciesOutputSchema
>;

export const ExtractTextFromFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "El contenido del archivo como un data URI que debe incluir un tipo MIME y usar codificación Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ExtractTextFromFileInput = z.infer<
  typeof ExtractTextFromFileInputSchema
>;

export const ExtractTextFromFileOutputSchema = z.object({
  text: z.string().describe('El texto extraído del archivo.'),
});
export type ExtractTextFromFileOutput = z.infer<
  typeof ExtractTextFromFileOutputSchema
>;