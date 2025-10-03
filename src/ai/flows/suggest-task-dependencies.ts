'use server';

/**
 * @fileOverview Un agente de IA para sugerir dependencias de tareas.
 *
 * - suggestTaskDependencies - Una función que sugiere dependencias de tareas.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestTaskDependenciesInputSchema,
  SuggestTaskDependenciesOutputSchema,
  type SuggestTaskDependenciesInput,
  type SuggestTaskDependenciesOutput,
} from '@/lib/types';

const suggestTaskDependenciesPrompt = ai.definePrompt({
  name: 'suggestTaskDependenciesPrompt',
  input: {schema: SuggestTaskDependenciesInputSchema},
  output: {schema: SuggestTaskDependenciesOutputSchema},
  prompt: `Eres un asistente de IA especializado en sugerir dependencias de tareas para recetas de cocina.

    Dado el nombre de una receta y una lista de tareas, sugerirás qué tareas dependen de qué otras tareas,
    basado en prácticas comunes de cocina.

    La salida debe ser un objeto JSON donde cada clave es un nombre de tarea de la lista de entrada,
    y el valor es una lista de nombres de tareas que son sus predecesoras. Si una tarea no tiene dependencias,
    su valor debe ser una lista vacía.

    Nombre de la Receta: {{{recipeName}}}
    Tareas: {{#each taskList}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

    Ejemplo de Salida:
    {
      "Picar verduras": [],
      "Hervir agua": [],
      "Añadir verduras al agua hirviendo": ["Picar verduras", "Hervir agua"]
    }
    
    Asegúrate de que las dependencias sean lógicas y sigan el orden natural de la cocina.
    Las tareas que no tengan dependencias deben tener un array vacío.
    No incluyas la tarea en sus propias dependencias.

    Responde ÚNICAMENTE con JSON válido. No incluyas ninguna explicación u otro texto.
    Aquí está el JSON:
    `,
});

const suggestTaskDependenciesFlow = ai.defineFlow(
  {
    name: 'suggestTaskDependenciesFlow',
    inputSchema: SuggestTaskDependenciesInputSchema,
    outputSchema: SuggestTaskDependenciesOutputSchema,
  },
  async input => {
    const {output} = await suggestTaskDependenciesPrompt(input);
    return output!;
  }
);

export async function suggestTaskDependencies(
  input: SuggestTaskDependenciesInput
): Promise<SuggestTaskDependenciesOutput> {
  return await suggestTaskDependenciesFlow(input);
}
