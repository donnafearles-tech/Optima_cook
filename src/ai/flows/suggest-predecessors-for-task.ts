/**
 * @fileOverview Un agente de IA para sugerir predecesores para una nueva tarea de cocina.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestPredecessorsForTaskInputSchema,
  SuggestPredecessorsForTaskOutputSchema,
} from '@/lib/types';

const suggestPredecessorsPrompt = (await ai).definePrompt({
  name: 'suggestPredecessorsPrompt',
  input: {schema: SuggestPredecessorsForTaskInputSchema},
  output: {schema: SuggestPredecessorsForTaskOutputSchema},
  prompt: `Actúas como un asistente de cocina experto en planificación y lógica de dependencias (Mise en Place).

    Se te proporcionará el nombre de una **nueva tarea** y una lista de **tareas existentes** en un proyecto de cocina. Cada tarea existente tiene un nombre y un ID único.

    Tu objetivo es analizar el nombre de la **nueva tarea** y determinar cuáles de las **tareas existentes** deben completarse antes de que la nueva pueda comenzar. Debes devolver una lista de los IDs de esas tareas predecesoras.

    Considera las siguientes reglas lógicas y culinarias como tu fuente de verdad absoluta:
    1.  **Secuencia de Preparación Obligatoria:**
        *   La acción de **Lavar** o **Pelar** un ingrediente SIEMPRE precede a la acción de **Cortar** o **Picar** ese mismo ingrediente.
        *   La acción de **Cortar** o **Picar** un ingrediente SIEMPRE precede a la acción de **Cocinarlo** (sofreír, hornear, freír).
        *   Ejemplo: Si la nueva tarea es "Sofreír zanahorias", busca si existe una tarea como "Picar zanahorias".

    2.  **Secuencia de Ensamblaje Obligatoria (Sándwiches, etc.):**
        *   La **Base** (ej. "Tostar pan") es lo primero.
        *   Luego viene la **Barrera/Adhesivo** (ej. "Untar mayonesa").
        *   Luego los **Ingredientes Sólidos/Húmedos** (ej. "Añadir jamón", "Poner tomate").
        *   Finalmente los **Ingredientes Ligeros/Sensibles** (ej. "Añadir lechuga").
        *   Ejemplo: Si la nueva tarea es "Colocar jamón", busca si existe una tarea como "Untar mayonesa" o "Tostar pan".

    3.  **Reglas de Equipos:**
        *   La tarea **"Precalentar horno"** o **"Precalentar sartén"** debe ser predecesora de cualquier tarea que use ese equipo (ej. "Hornear pavo", "Freír pollo").


    **Nueva Tarea a Analizar:**
    "{{{newTaskName}}}"

    **Tareas Existentes Disponibles (JSON):**
    {{{json existingTasks}}}

    Responde ÚNICAMENTE con un objeto JSON válido que contenga la clave "predecessorIds". Si no encuentras ninguna dependencia lógica, devuelve un array vacío. No incluyas ninguna explicación u otro texto.
    Aquí está el JSON:
    `,
});

export const suggestPredecessorsForTaskFlow = (await ai).defineFlow(
  {
    name: 'suggestPredecessorsForTaskFlow',
    inputSchema: SuggestPredecessorsForTaskInputSchema,
    outputSchema: SuggestPredecessorsForTaskOutputSchema,
  },
  async input => {
    if (input.existingTasks.length === 0) {
      return { predecessorIds: [] };
    }
    const {output} = await (await suggestPredecessorsPrompt)(input);
    return output!;
  }
);
