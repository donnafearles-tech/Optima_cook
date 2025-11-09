
// This file is no longer used for task consolidation as the logic has been
// moved to a native, client-side implementation in project-client-page.tsx.
// It is kept for archival purposes but can be safely deleted.
'use server';
/**
 * @fileOverview This AI agent for detecting and consolidating redundant or semantically equivalent cooking tasks is DEPRECATED.
 * The logic has been migrated to a native client-side implementation.
 */
import { ai } from '@/ai/genkit';
import {
  ConsolidateTasksInputSchema,
  ConsolidateTasksOutputSchema,
  type ConsolidateTasksInput,
  type ConsolidateTasksOutput,
} from '@/lib/types';
const consolidateTasksPrompt = (await ai).definePrompt({
  name: 'consolidateTasksPrompt',
  input: { schema: ConsolidateTasksInputSchema },
  output: { schema: ConsolidateTasksOutputSchema },
  prompt: `This prompt is deprecated and should not be used.`,
});
const consolidateTasksFlow = (await ai).defineFlow(
  {
    name: 'consolidateTasksFlow',
    inputSchema: ConsolidateTasksInputSchema,
    outputSchema: ConsolidateTasksOutputSchema,
  },
  async (input) => {
    throw new Error(
      'This flow is deprecated. Task consolidation is now handled by a native client-side algorithm.'
    );
  }
);
export async function consolidateTasks(
  input: ConsolidateTasksInput
): Promise<ConsolidateTasksOutput> {
  return await consolidateTasksFlow(input);
}
