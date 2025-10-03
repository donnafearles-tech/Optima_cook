'use server';

/**
 * @fileOverview A task dependency suggestion AI agent.
 *
 * - suggestTaskDependencies - A function that suggests task dependencies.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestTaskDependenciesInputSchema,
  SuggestTaskDependenciesOutputSchema,
  type SuggestTaskDependenciesInput,
  type SuggestTaskDependenciesOutput,
} from '@/lib/types';


const suggestTaskDependenciesFlow = ai.defineFlow(
  {
    name: 'suggestTaskDependenciesFlow',
    inputSchema: SuggestTaskDependenciesInputSchema,
    outputSchema: SuggestTaskDependenciesOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'suggestTaskDependenciesPrompt',
      input: {schema: SuggestTaskDependenciesInputSchema},
      output: {schema: SuggestTaskDependenciesOutputSchema},
      prompt: `You are an AI assistant specialized in suggesting task dependencies for cooking recipes.

  Given a recipe name and a list of tasks, you will suggest which tasks depend on which other tasks, 
  based on common cooking practices.

  The output should be a JSON object where each key is a task name from the input list,
  and the value is a list of task names that are its predecessors. If a task has no dependencies,
  its value should be an empty list.

  Recipe Name: {{{recipeName}}}
  Tasks: {{#each taskList}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Example Output:
  {
    "Chop vegetables": [],
    "Boil water": [],
    "Add vegetables to boiling water": ["Chop vegetables", "Boil water"]
  }
  
  Ensure that the dependencies are logical and follow the natural order of cooking.
  Tasks that don't have any dependencies should have an empty array.
  Do not include the task in its own dependencies.

  Respond ONLY with valid JSON. Do not include any explanation or other text.  
  Here is the JSON:
  `,
    });
    const {output} = await prompt(input);
    return output!;
  }
);

export async function suggestTaskDependencies(
  input: SuggestTaskDependenciesInput
): Promise<SuggestTaskDependenciesOutput> {
  return await suggestTaskDependenciesFlow(input);
}
