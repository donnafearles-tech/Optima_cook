'use server';

import {
  type ParseRecipeInput,
  type ParseRecipeOutput,
  type SuggestTaskDependenciesInput,
  type SuggestTaskDependenciesOutput,
  type ExtractTextFromFileInput,
  type ExtractTextFromFileOutput,
  type SuggestResourceForTaskInput,
  type SuggestResourceForTaskOutput,
  type SuggestKeywordsForResourceInput,
  type SuggestKeywordsForResourceOutput,
  type SuggestPredecessorsForTaskInput,
  type SuggestPredecessorsForTaskOutput
} from '@/lib/types';

import { parseRecipeFlow } from '@/ai/flows/parse-recipe';
import { suggestTaskDependenciesFlow } from '@/ai/flows/suggest-task-dependencies';
import { extractTextFromFileFlow } from '@/ai/flows/extract-text-from-file';
import { suggestResourceForTaskFlow } from '@/ai/flows/suggest-resource-for-task';
import { suggestKeywordsForResourceFlow } from '@/ai/flows/suggest-keyword-for-resource';
import { suggestPredecessorsForTaskFlow } from '@/ai/flows/suggest-predecessors-for-task';


export async function parseRecipe(input: ParseRecipeInput): Promise<ParseRecipeOutput> {
  const flow = await parseRecipeFlow;
  return await flow(input);
}

export async function suggestTaskDependencies(input: SuggestTaskDependenciesInput): Promise<SuggestTaskDependenciesOutput> {
  const flow = await suggestTaskDependenciesFlow;
  return await flow(input);
}

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractTextFromFileOutput> {
  const flow = await extractTextFromFileFlow;
  return await flow(input);
}

export async function suggestResourceForTask(input: SuggestResourceForTaskInput): Promise<SuggestResourceForTaskOutput> {
  const flow = await suggestResourceForTaskFlow;
  return await flow(input);
}

export async function suggestKeywordsForResource(input: SuggestKeywordsForResourceInput): Promise<SuggestKeywordsForResourceOutput> {
  const flow = await suggestKeywordsForResourceFlow;
  return await flow(input);
}

export async function suggestPredecessorsForTask(input: SuggestPredecessorsForTaskInput): Promise<SuggestPredecessorsForTaskOutput> {
  const flow = await suggestPredecessorsForTaskFlow;
  return await flow(input);
}
