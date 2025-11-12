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
  return await parseRecipeFlow(input);
}

export async function suggestTaskDependencies(input: SuggestTaskDependenciesInput): Promise<SuggestTaskDependenciesOutput> {
  return await suggestTaskDependenciesFlow(input);
}

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractTextFromFileOutput> {
  return await extractTextFromFileFlow(input);
}

export async function suggestResourceForTask(input: SuggestResourceForTaskInput): Promise<SuggestResourceForTaskOutput> {
    return await suggestResourceForTaskFlow(input);
}

export async function suggestKeywordsForResource(input: SuggestKeywordsForResourceInput): Promise<SuggestKeywordsForResourceOutput> {
    return await suggestKeywordsForResourceFlow(input);
}

export async function suggestPredecessorsForTask(input: SuggestPredecessorsForTaskInput): Promise<SuggestPredecessorsForTaskOutput> {
    return await suggestPredecessorsForTaskFlow(input);
}
