'use server';

/**
 * @fileOverview Un agente de IA para detectar y consolidar tareas de cocina redundantes o semánticamente equivalentes.
 *
 * - consolidateTasks - Una función que recibe una lista de tareas de múltiples recetas, las normaliza y las agrupa en tareas atómicas únicas.
 */

import {ai} from '@/ai/genkit';
import {
  ConsolidateTasksInputSchema,
  ConsolidateTasksOutputSchema,
  type ConsolidateTasksInput,
  type ConsolidateTasksOutput,
} from '@/lib/types';


const consolidateTasksPrompt = ai.definePrompt({
  name: 'consolidateTasksPrompt',
  input: {schema: ConsolidateTasksInputSchema},
  output: {schema: ConsolidateTasksOutputSchema},
  prompt: `Actúas como un Ingeniero de Procesos experto en optimización de "Mise en Place" en cocinas profesionales.
    Tu tarea es analizar una lista de tareas de múltiples recetas y consolidar aquellas que son funcionalmente idénticas para que se realicen una sola vez.

    **Objetivo Principal:**
    Dada una lista de tareas y recetas, agrupa las tareas que son semánticamente equivalentes, suma sus duraciones y unifica sus IDs de receta.

    **Instrucciones Detalladas:**

    1.  **Normalización Semántica (Paso Interno):**
        *   Para cada tarea, normaliza su nombre:
            *   Conviértelo a minúsculas.
            *   Elimina palabras de relleno comunes (ej. "los", "las", "el", "a", "de", "en", "para", "con").
            *   Aplica este diccionario de equivalencias culinarias a los verbos:
                *   "picar", "cortar", "rebanar", "trocear", "pica", "corta" -> "picar"
                *   "freír", "sofreír", "saltear", "dorar" -> "freir"
                *   "hornear", "meter al horno", "asar" -> "hornear"
                *   "hervir", "cocer en agua" -> "hervir"
                *   "mezclar", "combinar", "revolver" -> "mezclar"
                *   "lavar", "enjuagar" -> "lavar"

    2.  **Clustering de Tareas Similares:**
        *   Después de la normalización, agrupa las tareas que tienen la misma acción y el mismo ingrediente principal.
        *   **Ejemplo:** "picar cebolla" (de la receta A) y "cortar cebolla" (de la receta B) se convierten ambas en "picar cebolla" y deben ser agrupadas.

    3.  **Consolidación y Creación del Output:**
        *   Para cada grupo de tareas equivalentes, crea un único objeto en la lista 'consolidatedTasks'.
            *   `originalTaskIds`: Un array con los IDs de **todas** las tareas originales que se agruparon.
            *   `consolidatedName`: Un nuevo nombre descriptivo. Si la tarea se consolida de varias recetas, añade un sufijo como "(para varias recetas)". Ejemplo: "Picar cebolla (para varias recetas)". Si no, mantén el nombre original.
            *   `duration`: La **suma** de las duraciones de todas las tareas originales en el grupo.
            *   `recipeIds`: Un array con los IDs de todas las recetas únicas a las que pertenecían las tareas originales.
        *   Las tareas que no se pudieron agrupar con ninguna otra (son únicas) deben ser incluidas en la lista 'unconsolidatedTaskIds'. Devuelve sus IDs originales en este campo.

    **Input de Datos:**
    - Tareas: {{{json tasks}}}
    - Recetas: {{{json recipes}}}

    **Restricciones:**
    - No fusiones tareas que sean claramente diferentes después de la normalización (ej. "picar cebolla" y "picar tomate").
    - Responde **ÚNICAMENTE** con un objeto JSON válido que se ajuste al `ConsolidateTasksOutputSchema`. No incluyas explicaciones.
    `,
});

const consolidateTasksFlow = ai.defineFlow(
  {
    name: 'consolidateTasksFlow',
    inputSchema: ConsolidateTasksInputSchema,
    outputSchema: ConsolidateTasksOutputSchema,
  },
  async input => {
    const {output} = await consolidateTasksPrompt(input);
    return output!;
  }
);

export async function consolidateTasks(
  input: ConsolidateTasksInput
): Promise<ConsolidateTasksOutput> {
  return await consolidateTasksFlow(input);
}
