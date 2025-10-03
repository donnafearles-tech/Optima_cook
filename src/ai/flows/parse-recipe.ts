'use server';

/**
 * @fileOverview A recipe parsing AI agent.
 *
 * - parseRecipe - A function that parses a recipe from text.
 * - ParseRecipeInput - The input type for the parseRecipe function.
 * - ParseRecipeOutput - The return type for the parseRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
    name: z.string().describe('The name of the task.'),
    duration: z.number().describe('The estimated duration of the task in seconds.'),
});

export const ParseRecipeInputSchema = z.object({
  recipeText: z.string().describe('The full text of the recipe to parse.'),
});
export type ParseRecipeInput = z.infer<typeof ParseRecipeInputSchema>;

export const ParseRecipeOutputSchema = z.object({
    recipeName: z.string().describe('The name of the recipe.'),
    tasks: z.array(TaskSchema).describe('The list of tasks extracted from the recipe, with estimated durations.'),
});
export type ParseRecipeOutput = z.infer<typeof ParseRecipeOutputSchema>;


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
