'use server';

/**
 * @fileOverview A recipe parsing AI agent.
 *
 * - parseRecipe - A function that parses a recipe from text.
 */

import {ai} from '@/ai/genkit';
import {
  ParseRecipeInputSchema,
  ParseRecipeOutputSchema,
  type ParseRecipeInput,
  type ParseRecipeOutput,
} from '@/lib/types';

const parseRecipeFlow = ai.defineFlow(
  {
    name: 'parseRecipeFlow',
    inputSchema: ParseRecipeInputSchema,
    outputSchema: ParseRecipeOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'parseRecipePrompt',
      input: {schema: ParseRecipeInputSchema},
      output: {schema: ParseRecipeOutputSchema},
      prompt: `You are an expert recipe parser. Your job is to read a recipe and break it down into a series of tasks with estimated durations.

  Extract the recipe name and a list of tasks from the following recipe text. For each task, provide a descriptive name and an estimated duration in seconds.

  - Be granular with tasks. For example, "chop onions" is a good task. "Prepare vegetables" is too broad.
  - The duration should be a reasonable estimate for a home cook.
  - If a task involves waiting (e.g., "let it rest for 10 minutes"), include the waiting time in the duration.
  - Only include the cooking steps as tasks, not the ingredient list.

  Recipe Text:
  {{{recipeText}}}

  Respond ONLY with valid JSON. Do not include any explanation or other text.
  Here is the JSON:
  `,
    });

    const {output} = await prompt(input);
    return output!;
  }
);

export async function parseRecipe(
  input: ParseRecipeInput
): Promise<ParseRecipeOutput> {
  return await parseRecipeFlow(input);
}
