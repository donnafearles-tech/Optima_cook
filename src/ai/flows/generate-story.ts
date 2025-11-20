/**
 * @fileOverview Un agente de IA para generar una historia corta.
 *
 * - generateStory - Una función que genera una historia basada en un prompt de texto.
 */
import {ai} from '@/ai/genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import {z} from 'zod';

// Define el esquema de entrada para el flujo de generación de historias.
export const GenerateStoryInputSchema = z.object({
  prompt: z
    .string()
    .describe('El tema o la idea inicial para la historia a generar.'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

// Define el esquema de salida.
export const GenerateStoryOutputSchema = z.object({
  story: z.string().describe('La historia generada.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

// Define el prompt de Genkit
const storyPrompt = ai.definePrompt({
    name: 'storyPrompt',
    input: {schema: GenerateStoryInputSchema},
    output: {schema: GenerateStoryOutputSchema},
    model: vertexAI.model('gemini-2.5-flash'),
    prompt: `Escribe una historia corta y creativa sobre: {{{prompt}}}`,
  });

// Define el flujo de Genkit que utiliza el prompt.
export const generateStoryFlow = ai.defineFlow(
    {
      name: 'generateStoryFlow',
      inputSchema: GenerateStoryInputSchema,
      outputSchema: GenerateStoryOutputSchema,
    },
    async input => {
      const {output} = await storyPrompt(input);
      return {story: output?.story || 'No se pudo generar una historia.'};
    }
  );
