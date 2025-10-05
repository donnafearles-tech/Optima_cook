'use server';

/**
 * @fileOverview Un agente de IA para sugerir predecesores para una nueva tarea de cocina.
 *
 * - suggestPredecessorsForTask - Una función que sugiere los IDs de las tareas predecesoras.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestPredecessorsForTaskInputSchema,
  SuggestPredecessorsForTaskOutputSchema,
  type SuggestPredecessorsForTaskInput,
  type SuggestPredecessorsForTaskOutput,
} from '@/lib/types';

const suggestPredecessorsPrompt = ai.definePrompt({
  name: 'suggestPredecessorsPrompt',
  input: {schema: SuggestPredecessorsForTaskInputSchema},
  output: {schema: SuggestPredecessorsForTaskOutputSchema},
  prompt: `Actúas como un asistente de cocina experto en planificación y lógica de dependencias (Mise en Place).

    Se te proporcionará el nombre de una **nueva tarea** y una lista de **tareas existentes** en un proyecto de cocina. Cada tarea existente tiene un nombre y un ID único.

    Tu objetivo es analizar el nombre de la **nueva tarea** y determinar cuáles de las **tareas existentes** deben completarse antes de que la nueva pueda comenzar. Debes devolver una lista de los IDs de esas tareas predecesoras.

    Considera las siguientes reglas lógicas y culinarias:
    1.  **Preparación antes de la acción:** Una tarea de preparación (ej. "picar cebolla", "lavar lechuga") debe preceder a una tarea de cocción o ensamblaje que use ese ingrediente (ej. "sofreír cebolla", "añadir lechuga al sándwich").
    2.  **Cocciones largas primero:** Las tareas de cocción lenta (ej. "hornear pavo", "cocer caldo") suelen ser predecesoras de tareas más cortas.
    3.  **Mise en Place:** Las tareas de "mise en place" (preparación de ingredientes) casi siempre son predecesoras de las tareas de cocción.

    **Nueva Tarea a Analizar:**
    "{{{newTaskName}}}"

    **Tareas Existentes Disponibles (JSON):**
    {{{json existingTasks}}}

    Responde ÚNICAMENTE con un objeto JSON válido que contenga la clave "predecessorIds". Si no encuentras ninguna dependencia lógica, devuelve un array vacío. No incluyas ninguna explicación u otro texto.
    Aquí está el JSON:
    `,
});

const suggestPredecessorsForTaskFlow = ai.defineFlow(
  {
    name: 'suggestPredecessorsForTaskFlow',
    inputSchema: SuggestPredecessorsForTaskInputSchema,
    outputSchema: SuggestPredecessorsForTaskOutputSchema,
  },
  async input => {
    if (input.existingTasks.length === 0) {
      return { predecessorIds: [] };
    }
    const {output} = await suggestPredecessorsPrompt(input);
    return output!;
  }
);

export async function suggestPredecessorsForTask(
  input: SuggestPredecessorsForTaskInput
): Promise<SuggestPredecessorsForTaskOutput> {
  return await suggestPredecessorsForTaskFlow(input);
}
