/**
 * @fileOverview Un agente de IA para sugerir recursos de cocina para una tarea.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestResourceForTaskInputSchema,
  SuggestResourceForTaskOutputSchema,
} from '@/lib/types';
import { vertexAI } from '@genkit-ai/vertexai';

const suggestResourcePrompt = ai.definePrompt({
      name: 'suggestResourcePrompt',
      input: {schema: SuggestResourceForTaskInputSchema},
      output: {schema: SuggestResourceForTaskOutputSchema},
      model: vertexAI.model('gemini-1.5-flash'),
      prompt: `Actúas como un asistente de cocina inteligente. Tu objetivo es vincular una tarea de cocina con los recursos necesarios para realizarla.

    Se te proporcionará el nombre de una tarea y una lista de los recursos de cocina disponibles para el usuario. Cada recurso tiene un nombre, una cantidad y una lista de palabras clave.

    Tu trabajo es analizar el nombre de la tarea para ver si coincide con alguna de las palabras clave de los recursos.

    - La coincidencia debe ser lógica. Por ejemplo, la tarea "Saltear verduras" debe coincidir con un recurso que tenga la palabra clave "saltear", como una "Sartén".
    - Si la tarea no parece requerir ningún recurso especial de la lista (p ej., "Lavar lechuga"), devuelve un array vacío.
    - Si encuentras una coincidencia, devuelve un array que contenga el ID del recurso coincidente.

    **Tarea a analizar:**
    "{{{taskName}}}"

    **Recursos Disponibles (JSON):**
    {{{json userResources}}}

    Responde ÚNICAMENTE con un objeto JSON válido que contenga la clave "resourceIds". No incluyas ninguna explicación u otro texto.
    Aquí está el JSON:
    `,
    });

export const suggestResourceForTaskFlow = ai.defineFlow(
      {
        name: 'suggestResourceForTaskFlow',
        inputSchema: SuggestResourceForTaskInputSchema,
        outputSchema: SuggestResourceForTaskOutputSchema,
      },
      async input => {
        const {output} = await suggestResourcePrompt(input);
        return output!;
      }
    );
