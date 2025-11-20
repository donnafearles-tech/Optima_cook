// This route is the new entry point for all Genkit flows.
// It uses the @genkit-ai/next plugin to handle requests.

import { appRoute } from '@genkit-ai/next';

// Import all flows that should be exposed via the API
import { parseRecipeFlow } from '@/ai/flows/parse-recipe';
import { suggestTaskDependenciesFlow } from '@/ai/flows/suggest-task-dependencies';
import { extractTextFromFileFlow } from '@/ai/flows/extract-text-from-file';
import { suggestResourceForTaskFlow } from '@/ai/flows/suggest-resource-for-task';
import { suggestKeywordsForResourceFlow } from '@/ai/flows/suggest-keyword-for-resource';
import { suggestPredecessorsForTaskFlow } from '@/ai/flows/suggest-predecessors-for-task';
import { generateRecipeFlow } from '@/ai/flows/generate-recipe';

// The appRoute function takes an object where keys are route paths
// and values are the flow definitions.
export const POST = appRoute({
  // The key here `parseRecipeFlow` will make this flow available at `/api/genkit/parseRecipeFlow`
  parseRecipeFlow,
  suggestTaskDependenciesFlow,
  extractTextFromFileFlow,
  suggestResourceForTaskFlow,
  suggestKeywordsForResourceFlow,
  suggestPredecessorsForTaskFlow,
  generateRecipeFlow,
});
