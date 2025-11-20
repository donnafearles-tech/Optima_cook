'use server';
/**
 * @fileOverview Un agente de IA para generar una receta a partir de una lista de ingredientes.
 *
 * - generateRecipeFlow - Una función que genera una receta.
 * - GenerateRecipeInputSchema - El tipo de entrada para la función generateRecipeFlow.
 * - GenerateRecipeOutputSchema - El tipo de retorno para la función generateRecipeFlow.
 */
import {ai} from '@/ai/genkit';
import {
  GenerateRecipeInputSchema,
  GenerateRecipeOutputSchema,
} from '@/lib/types';
import { vertexAI } from '@genkit-ai/vertexai';

const recipePrompt = ai.definePrompt({
  name: 'recipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  model: vertexAI.model('gemini-2.5-flash'),
  prompt: `Eres un chef experto. Dada una lista de ingredientes, crea una receta simple y deliciosa.

    **Reglas:**
    1.  El título debe ser creativo y apetitoso.
    2.  La lista de ingredientes en la salida debe estar bien formateada, incluyendo las cantidades proporcionadas.
    3.  Los pasos deben ser claros, concisos y fáciles de seguir.
    4.  Utiliza solo los ingredientes proporcionados.

    **Ingredientes proporcionados:**
    {{{ingredients}}}

    Responde ÚNICAMENTE con un objeto JSON válido que se ajuste al esquema de salida. No incluyas explicaciones, solo el JSON.
    `,
});

export const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    const {output} = await recipePrompt(input);
    return output!;
  }
);
