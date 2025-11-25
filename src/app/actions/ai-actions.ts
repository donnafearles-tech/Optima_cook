'use server';

import { ai } from '@/ai/genkit';
import {
  type SuggestTaskDependenciesInput,
  type SuggestResourceForTaskInput,
  type SuggestPredecessorsForTaskInput,
  type SuggestKeywordsForResourceInput,
  type GenerateRecipeInput,
  type ParseRecipeInput,
} from '@/lib/types';

import { suggestTaskDependenciesFlow } from '@/ai/flows/suggest-task-dependencies';
import { suggestResourceForTaskFlow } from '@/ai/flows/suggest-resource-for-task';
import { suggestPredecessorsForTaskFlow } from '@/ai/flows/suggest-predecessors-for-task';
import { suggestKeywordsForResourceFlow } from '@/ai/flows/suggest-keyword-for-resource';
import { generateRecipeFlow } from '@/ai/flows/generate-recipe';
import { extractTextFromFileFlow } from '@/ai/flows/extract-text-from-file';
import { parseRecipeFlow } from '@/ai/flows/parse-recipe';


export async function parseRecipe(input: ParseRecipeInput) {
  try {
    const result = await parseRecipeFlow(input);
    return result;
  } catch (error: any) {
    // IMPRIMIR EL ERROR REAL EN LA TERMINAL
    console.error("🔥 ERROR REAL DE VERTEX:", error); 
    console.error("Detalles:", JSON.stringify(error, null, 2));

    // Lanzar el error original para verlo en la pantalla de error de Next.js
    throw error; 
  }
}

export async function extractTextFromFile(input: { fileDataUri: string }) {
  try {
    const result = await extractTextFromFileFlow(input);
    return result;
  } catch (error: any) {
    // IMPRIMIR EL ERROR REAL EN LA TERMINAL
    console.error("🔥 ERROR REAL DE VERTEX:", error); 
    console.error("Detalles:", JSON.stringify(error, null, 2));

    // Lanzar el error original para verlo en la pantalla de error de Next.js
    throw error; 
  }
}

export async function suggestTaskDependencies(input: SuggestTaskDependenciesInput) {
  try {
    const result = await suggestTaskDependenciesFlow(input);
    return result;
  } catch (error: any) {
    // IMPRIMIR EL ERROR REAL EN LA TERMINAL
    console.error("🔥 ERROR REAL DE VERTEX:", error); 
    console.error("Detalles:", JSON.stringify(error, null, 2));

    // Lanzar el error original para verlo en la pantalla de error de Next.js
    throw error; 
  }
}

export async function suggestResourceForTask(input: SuggestResourceForTaskInput) {
  try {
    const result = await suggestResourceForTaskFlow(input);
    return result;
  } catch (error: any) {
    // IMPRIMIR EL ERROR REAL EN LA TERMINAL
    console.error("🔥 ERROR REAL DE VERTEX:", error); 
    console.error("Detalles:", JSON.stringify(error, null, 2));

    // Lanzar el error original para verlo en la pantalla de error de Next.js
    throw error; 
  }
}

export async function suggestPredecessorsForTask(input: SuggestPredecessorsForTaskInput) {
  try {
    const result = await suggestPredecessorsForTaskFlow(input);
    return result;
  } catch (error: any) {
    // IMPRIMIR EL ERROR REAL EN LA TERMINAL
    console.error("🔥 ERROR REAL DE VERTEX:", error); 
    console.error("Detalles:", JSON.stringify(error, null, 2));

    // Lanzar el error original para verlo en la pantalla de error de Next.js
    throw error; 
  }
}

export async function suggestKeywordsForResource(input: SuggestKeywordsForResourceInput) {
    try {
        return await suggestKeywordsForResourceFlow(input);
    } catch (error: any) {
        // IMPRIMIR EL ERROR REAL EN LA TERMINAL
        console.error("🔥 ERROR REAL DE VERTEX:", error); 
        console.error("Detalles:", JSON.stringify(error, null, 2));

        // Lanzar el error original para verlo en la pantalla de error de Next.js
        throw error; 
    }
}

export async function generateRecipe(input: GenerateRecipeInput) {
    try {
        return await generateRecipeFlow(input);
    } catch (error: any) {
        // IMPRIMIR EL ERROR REAL EN LA TERMINAL
        console.error("🔥 ERROR REAL DE VERTEX:", error); 
        console.error("Detalles:", JSON.stringify(error, null, 2));

        // Lanzar el error original para verlo en la pantalla de error de Next.js
        throw error; 
    }
}
