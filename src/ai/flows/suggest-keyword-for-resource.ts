/**
 * @fileOverview Un agente de IA para sugerir palabras clave para un recurso de cocina.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestKeywordsForResourceInputSchema,
  SuggestKeywordsForResourceOutputSchema,
} from '@/lib/types';
import { vertexAI } from '@genkit-ai/vertexai';


const suggestKeywordsPrompt = ai.definePrompt({
      name: 'suggestKeywordsPrompt',
      input: {schema: SuggestKeywordsForResourceInputSchema},
      output: {schema: SuggestKeywordsForResourceOutputSchema},
      model: vertexAI.model('gemini-1.5-flash'),
      prompt: `Actúas como un experto en cocina y lingüística. Tu objetivo es generar una lista de palabras clave relevantes para un utensilio de cocina.

    Se te proporcionará el nombre de un recurso de cocina. Debes devolver una lista de palabras clave que incluyan:
    1.  El nombre del recurso en singular y plural.
    2.  Verbos de acción comunes asociados con ese recurso.
    3.  Sinónimos o términos relacionados.

    Ejemplo:
    - Recurso: "Sartén"
    - Palabras clave: ["sarten", "sartenes", "saltear", "freir", "dorar", "plancha"]

    **Recurso a analizar:**
    "{{{resourceName}}}"

    Responde ÚNICAMENTE con un objeto JSON válido que contenga la clave "keywords". No incluyas ninguna explicación u otro texto.
    `,
    });

export const suggestKeywordsForResourceFlow = ai.defineFlow(
      {
        name: 'suggestKeywordsForResourceFlow',
        inputSchema: SuggestKeywordsForResourceInputSchema,
        outputSchema: SuggestKeywordsForResourceOutputSchema,
      },
      async input => {
        const {output} = await suggestKeywordsPrompt(input);
        return output!;
      }
    );
