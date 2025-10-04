import {z} from 'zod';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  duration: number; // en segundos
  recipeIds: string[];
  predecessorIds: string[];
  resourceIds: string[];
  status: TaskStatus;
  isAssemblyStep?: boolean;
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

export interface UserResource {
  id: string;
  name: string;
  quantity: number;
  keywords: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
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
  predecessorIds: z.array(z.string()).describe("Una lista de los nombres de las tareas que deben completarse antes de que esta tarea pueda comenzar."),
  isAssemblyStep: z.boolean().describe("Es 'true' si la tarea es parte del proceso de armado final, 'false' si es una tarea de preparación (mise en place).")
});

export const ParseRecipeInputSchema = z.object({
  recipeText: z.string().optional().describe('El texto completo de la receta para analizar.'),
  ingredients: z.array(z.string()).optional().describe('Lista de ingredientes para deducir el ensamblaje.'),
  knowledgeBaseText: z.string().optional().describe('Texto de un manual o base de conocimiento para dar contexto adicional a la IA.'),
});
export type ParseRecipeInput = z.infer<typeof ParseRecipeInputSchema>;

export const ParseRecipeOutputSchema = z.object({
    recipeName: z.string().describe('El nombre de la receta.'),
    tasks: z.array(AiTaskSchema).describe('La lista de tareas extraídas de la receta, con duraciones estimadas, dependencias y si son de ensamblaje.'),
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

const DependencyPairSchema = z.object({
  taskName: z.string().describe('El nombre de la tarea.'),
  predecessorNames: z.array(z.string()).describe('Una lista de nombres de tareas que son sus predecesoras.'),
});

export const SuggestTaskDependenciesOutputSchema = z.object({
  dependencies: z.array(DependencyPairSchema).describe('Una lista de tareas, cada una con sus predecesoras sugeridas.'),
});
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


const UserResourceSchema = z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    keywords: z.array(z.string()),
});

export const SuggestResourceForTaskInputSchema = z.object({
  taskName: z.string().describe('El nombre de la tarea para la que se necesita un recurso.'),
  userResources: z.array(UserResourceSchema).describe('La lista de recursos de cocina disponibles para el usuario, incluyendo sus palabras clave.'),
});
export type SuggestResourceForTaskInput = z.infer<typeof SuggestResourceForTaskInputSchema>;

export const SuggestResourceForTaskOutputSchema = z.object({
    resourceIds: z.array(z.string()).describe('Una lista de los IDs de los recursos sugeridos para la tarea.'),
});
export type SuggestResourceForTaskOutput = z.infer<typeof SuggestResourceForTaskOutputSchema>;


export const SuggestKeywordsForResourceInputSchema = z.object({
  resourceName: z.string().describe('El nombre del recurso de cocina (ej. "Sartén", "Licuadora").'),
});
export type SuggestKeywordsForResourceInput = z.infer<typeof SuggestKeywordsForResourceInputSchema>;

export const SuggestKeywordsForResourceOutputSchema = z.object({
    keywords: z.array(z.string()).describe('Una lista de palabras clave sugeridas (verbos de acción o sinónimos) asociadas con el recurso.'),
});
export type SuggestKeywordsForResourceOutput = z.infer<typeof SuggestKeywordsForResourceOutputSchema>;

const TaskInputSchema = z.object({
    id: z.string(),
    name: z.string(),
    duration: z.number(),
    predecessorIds: z.array(z.string()),
    recipeIds: z.array(z.string()),
});

const RecipeInputSchema = z.object({
    id: z.string(),
    name: z.string(),
})

export const ConsolidateTasksInputSchema = z.object({
  tasks: z.array(TaskInputSchema).describe("La lista completa de tareas de todas las recetas en el proyecto."),
  recipes: z.array(RecipeInputSchema).describe("La lista de recetas en el proyecto para mapear nombres de recetas.")
});
export type ConsolidateTasksInput = z.infer<typeof ConsolidateTasksInputSchema>;


const ConsolidatedTaskSchema = z.object({
  originalTaskIds: z.array(z.string()).describe("Los IDs de las tareas originales que fueron consolidadas en esta."),
  consolidatedName: z.string().describe("El nuevo nombre unificado para la tarea consolidada. Por ejemplo, 'Picar cebolla (para todas las recetas)'."),
  duration: z.number().describe("La suma de las duraciones de todas las tareas originales consolidadas."),
  recipeIds: z.array(zstring()).describe("Un array con los IDs de todas las recetas que requieren esta tarea."),
});

export const ConsolidateTasksOutputSchema = z.object({
    consolidatedTasks: z.array(ConsolidatedTaskSchema).describe("La lista de tareas consolidadas. Cada tarea representa un grupo de tareas originales unificadas."),
    unconsolidatedTaskIds: z.array(z.string()).describe("Los IDs de las tareas que no pudieron ser consolidadas y deben permanecer como están.")
});
export type ConsolidateTasksOutput = z.infer<typeof ConsolidateTasksOutputSchema>;
